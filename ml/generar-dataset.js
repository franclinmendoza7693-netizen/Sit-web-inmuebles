// =====================================================================
// ml/generar-dataset.js — dueño: Dev B
// ---------------------------------------------------------------------
// Genera un dataset SINTÉTICO calibrado con la tabla de ejemplo del enunciado
// (sección 6.1 del plan). En el informe se declara que es sintético.
//
//   npm run dataset                              → 2 000 filas, semilla 2026
//   node ml/generar-dataset.js --filas 5000 --semilla 7
//
// Salida: public/admin/datos/inmuebles.csv con las columnas EXACTAS del contrato:
//   superficie_m2,num_habitaciones,zona,anio_construccion,precio_miles_usd
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- Parámetros ----------
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pares, v, i, arr) => {
    if (v.startsWith('--')) pares.push([v.slice(2), arr[i + 1]]);
    return pares;
  }, []),
);
const FILAS = Number(args.filas) || 2000;
const SEMILLA = Number(args.semilla) || 2026;
const SALIDA = path.resolve(RAIZ, args.salida || 'public/admin/datos/inmuebles.csv');

const FACTOR_ZONA = { centro: 1.0, suburbio: 1.05, rural: 0.83 };
const PESOS_ZONA = [
  ['centro', 0.4],
  ['suburbio', 0.4],
  ['rural', 0.2],
];

// ---------- Aleatorio reproducible (mulberry32) ----------
function crearAleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const aleatorio = crearAleatorio(SEMILLA);
const entre = (min, max) => min + aleatorio() * (max - min);
const enteroEntre = (min, max) => Math.floor(entre(min, max + 1));
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

function elegirZona() {
  let r = aleatorio();
  for (const [zona, peso] of PESOS_ZONA) {
    if ((r -= peso) < 0) return zona;
  }
  return PESOS_ZONA.at(-1)[0];
}

// ---------- Fórmula de precio (miles de USD) ----------
export function precioBase({ superficie_m2, num_habitaciones, zona, anio_construccion }) {
  return (
    2.2 * superficie_m2 * FACTOR_ZONA[zona] + 8 * num_habitaciones + 2 * (anio_construccion - 2000)
  );
}

function generarFila() {
  // 75 % de los casos entre 60 y 200 m²; el resto en todo el rango 40–400 m²
  const superficie_m2 = Math.round(aleatorio() < 0.75 ? entre(60, 200) : entre(40, 400));
  const num_habitaciones = limitar(Math.round(superficie_m2 / 35) + enteroEntre(-1, 1), 1, 6);
  const zona = elegirZona();
  const anio_construccion = enteroEntre(1970, 2025);
  const ruido = entre(0.92, 1.08);
  const precio = Math.max(30, precioBase({ superficie_m2, num_habitaciones, zona, anio_construccion }) * ruido);
  return {
    superficie_m2,
    num_habitaciones,
    zona,
    anio_construccion,
    precio_miles_usd: Math.round(precio * 10) / 10,
  };
}

// ---------- Generar y guardar ----------
const COLUMNAS = ['superficie_m2', 'num_habitaciones', 'zona', 'anio_construccion', 'precio_miles_usd'];
const filas = Array.from({ length: FILAS }, generarFila);
const csv = [COLUMNAS.join(','), ...filas.map((f) => COLUMNAS.map((c) => f[c]).join(','))].join('\n') + '\n';

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, csv);

// ---------- Resumen ----------
const resumen = (col) => {
  const v = filas.map((f) => f[col]);
  const prom = v.reduce((a, b) => a + b, 0) / v.length;
  return `${col.padEnd(18)} min ${Math.min(...v)}  máx ${Math.max(...v)}  promedio ${prom.toFixed(1)}`;
};
const conteoZonas = Object.fromEntries(
  Object.keys(FACTOR_ZONA).map((z) => [z, filas.filter((f) => f.zona === z).length]),
);

console.log(`✔ ${FILAS} filas (semilla ${SEMILLA}) → ${path.relative(RAIZ, SALIDA)}\n`);
['superficie_m2', 'num_habitaciones', 'anio_construccion', 'precio_miles_usd'].forEach((c) =>
  console.log('  ' + resumen(c)),
);
console.log('  zonas             ', conteoZonas);

console.log('\nCasos del enunciado (fórmula sin ruido vs. tabla):');
[
  [100, 3, 'centro', 2005, 250],
  [150, 4, 'suburbio', 2010, 400],
  [120, 3, 'centro', 2008, 320],
  [180, 5, 'suburbio', 2015, 500],
  [90, 2, 'rural', 2000, 180],
].forEach(([superficie_m2, num_habitaciones, zona, anio_construccion, esperado]) => {
  const p = precioBase({ superficie_m2, num_habitaciones, zona, anio_construccion });
  const dif = ((p / esperado - 1) * 100).toFixed(1);
  console.log(`  ${superficie_m2} m², ${num_habitaciones} hab., ${zona.padEnd(8)} ${anio_construccion} → ${p.toFixed(1)} (tabla ${esperado}, ${dif} %)`);
});
