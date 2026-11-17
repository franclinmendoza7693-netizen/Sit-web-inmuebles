// =====================================================================
// public/js/modelo/preprocesamiento.js — dueño: Dev B
// ---------------------------------------------------------------------
// Funciones PURAS (sin TensorFlow) para preparar los datos del modelo.
// Las usa entrenamiento.js y, desde el día 3, también prediccion.js:
// así entrenar y predecir transforman los datos EXACTAMENTE igual.
//
//   limpiarFilas → dividir (80/20) → calcularNormalizacion → vectorizar
// =====================================================================
import { ENTRADAS_MODELO, ZONAS } from '/shared/contrato.js';

export const COLUMNAS_NUMERICAS = ['superficie_m2', 'num_habitaciones', 'anio_construccion'];
export const OBJETIVO = 'precio_miles_usd'; // el modelo trabaja en MILES de USD
export const SEMILLA = 2026; // misma semilla = misma separación 80/20 en cada ejecución

// ---------- Aleatorio reproducible (mulberry32) ----------
export function crearAleatorio(semilla = SEMILLA) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 1. Limpieza ----------
// Deja solo filas con números válidos y una zona del contrato.
export function limpiarFilas(filas) {
  const validas = [];
  let descartadas = 0;
  for (const f of filas) {
    const fila = {
      superficie_m2: Number(f.superficie_m2),
      num_habitaciones: Number(f.num_habitaciones),
      anio_construccion: Number(f.anio_construccion),
      zona: String(f.zona ?? '').trim().toLowerCase(),
      precio_miles_usd: Number(f.precio_miles_usd),
    };
    const numerosOk = [...COLUMNAS_NUMERICAS, OBJETIVO].every((c) => Number.isFinite(fila[c]));
    if (numerosOk && ZONAS.includes(fila.zona)) validas.push(fila);
    else descartadas++;
  }
  return { validas, descartadas };
}

// ---------- 2. Separación entrenamiento / prueba ----------
export function mezclar(filas, semilla = SEMILLA) {
  const aleatorio = crearAleatorio(semilla);
  const copia = [...filas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function dividir(filas, { proporcion = 0.8, semilla = SEMILLA } = {}) {
  const mezcladas = mezclar(filas, semilla);
  const corte = Math.round(mezcladas.length * proporcion);
  return { entrenamiento: mezcladas.slice(0, corte), prueba: mezcladas.slice(corte) };
}

// ---------- 3. Normalización min-max ----------
// Se calcula SOLO con el set de entrenamiento (si se usa el de prueba, el modelo "hace trampa").
export function calcularNormalizacion(filasEntrenamiento) {
  const min = {};
  const max = {};
  for (const c of [...COLUMNAS_NUMERICAS, OBJETIVO]) {
    const valores = filasEntrenamiento.map((f) => f[c]);
    min[c] = Math.min(...valores);
    max[c] = Math.max(...valores);
  }
  return { entradas: [...ENTRADAS_MODELO], min, max };
}

export function escalar(valor, columna, norm) {
  const rango = norm.max[columna] - norm.min[columna];
  return rango === 0 ? 0 : (valor - norm.min[columna]) / rango;
}

export function desescalar(valor01, columna, norm) {
  return valor01 * (norm.max[columna] - norm.min[columna]) + norm.min[columna];
}

// ---------- 4. Vector de entrada (orden de ENTRADAS_MODELO) ----------
// zona_centro / zona_suburbio / zona_rural → one-hot (1 en la zona del inmueble, 0 en las demás)
export function vectorizar(fila, norm) {
  return ENTRADAS_MODELO.map((entrada) => {
    if (entrada.startsWith('zona_')) return fila.zona === entrada.slice(5) ? 1 : 0;
    return escalar(Number(fila[entrada]), entrada, norm);
  });
}

// ¿El inmueble está dentro del rango con el que se entrenó? (para el aviso de baja confianza)
export function fueraDeRango(fila, norm) {
  return COLUMNAS_NUMERICAS.some((c) => Number(fila[c]) < norm.min[c] || Number(fila[c]) > norm.max[c]);
}

// ---------- Todo junto ----------
// Devuelve arreglos listos para convertir en tensores con tf.tensor2d (día 2).
export function prepararDatos(filas, opciones = {}) {
  const { entrenamiento, prueba } = dividir(filas, opciones);
  const normalizacion = calcularNormalizacion(entrenamiento);
  const aX = (lista) => lista.map((f) => vectorizar(f, normalizacion));
  const aY = (lista) => lista.map((f) => [escalar(f[OBJETIVO], OBJETIVO, normalizacion)]);
  return {
    normalizacion,
    entrenamiento,
    prueba,
    xEntrenamiento: aX(entrenamiento),
    yEntrenamiento: aY(entrenamiento),
    xPrueba: aX(prueba),
    yPrueba: aY(prueba),
  };
}

// ---------- Resumen para revisar el dataset ----------
export function resumir(filas) {
  const columnas = {};
  for (const c of [...COLUMNAS_NUMERICAS, OBJETIVO]) {
    const v = filas.map((f) => f[c]);
    columnas[c] = {
      min: Math.min(...v),
      max: Math.max(...v),
      promedio: v.reduce((a, b) => a + b, 0) / v.length,
    };
  }
  const zonas = Object.fromEntries(ZONAS.map((z) => [z, filas.filter((f) => f.zona === z).length]));
  const precioPromedioZona = Object.fromEntries(
    ZONAS.map((z) => {
      const deZona = filas.filter((f) => f.zona === z);
      return [z, deZona.reduce((a, f) => a + f[OBJETIVO], 0) / (deZona.length || 1)];
    }),
  );
  return { total: filas.length, columnas, zonas, precioPromedioZona };
}