// public/js/paginas/entrenamiento.js — dueño: Dev B (Día 1)
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
import { ENTRADAS_MODELO } from '/shared/contrato.js';

// Verificación de acceso y navbar (si estás probando sin login puedes comentar protegerPagina temporalmente)
if (protegerPagina({ rol: 'admin' })) renderNavbar();

// Referencias del DOM acordadas
const btnCargar = document.getElementById('btn-cargar-datos');
const divEstado = document.getElementById('estado-entrenamiento');

// Variables de estado del Día 1
let datosCrudos = [];
let trainData = null;
let testData = null;
let normalizacion = null;

function setEstado(msg) {
  if (divEstado) divEstado.textContent = msg;
}

// ==========================================
// TAREA 1: Cargar CSV con Papa Parse (CDN)
// ==========================================
btnCargar?.addEventListener('click', () => {
  setEstado('Cargando dataset desde CSV...');

  Papa.parse('/admin/datos/inmuebles.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      datosCrudos = results.data;
      console.log(`✅ CSV cargado: ${datosCrudos.length} filas.`);
      
      // Ejecutar preprocesamiento
      preprocesarDatos();
    },
    error: (err) => {
      setEstado(`Error al leer CSV: ${err.message}`);
      console.error(err);
    }
  });
});

// ==============================================================
// TAREA 2: Preprocesamiento (One-hot, Min-Max, Separación 80/20)
// ==============================================================
function preprocesarDatos() {
  if (!datosCrudos || datosCrudos.length === 0) return;

  // 1. Separación 80/20 con barajado de semilla fija (reproducible)
  const barajados = [...datosCrudos];
  let semilla = 2026;
  for (let i = barajados.length - 1; i > 0; i--) {
    semilla = (semilla * 9301 + 49297) % 233280;
    const j = Math.floor((semilla / 233280) * (i + 1));
    [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
  }

  const corte = Math.floor(barajados.length * 0.8);
  const trainFilas = barajados.slice(0, corte);
  const testFilas = barajados.slice(corte);

  // 2. Calcular límites Min y Max ÚNICAMENTE sobre el set de entrenamiento
  const min = {
    superficie_m2: Infinity,
    num_habitaciones: Infinity,
    anio_construccion: Infinity,
    precio_miles_usd: Infinity
  };
  const max = {
    superficie_m2: -Infinity,
    num_habitaciones: -Infinity,
    anio_construccion: -Infinity,
    precio_miles_usd: -Infinity
  };

  for (const f of trainFilas) {
    for (const key of Object.keys(min)) {
      if (f[key] < min[key]) min[key] = f[key];
      if (f[key] > max[key]) max[key] = f[key];
    }
  }

  // Estructura oficial según sección 6.2 del plan
  normalizacion = {
    version_modelo: '1.0.0',
    entradas: ENTRADAS_MODELO,
    min,
    max,
    metricas_test: { mse: 0, mae_usd: 0, rmse_usd: 0, r2: 0 }
  };

  const escalar = (v, key) => (v - min[key]) / (max[key] - min[key]);

  // 3. One-hot encoding y armado de tensores con orden estricto de ENTRADAS_MODELO
  const transformarLote = (filas) => {
    const xArr = [];
    const yArr = [];

    for (const d of filas) {
      // Objeto intermedio con las variables procesadas
      const mapeo = {
        superficie_m2: escalar(d.superficie_m2, 'superficie_m2'),
        num_habitaciones: escalar(d.num_habitaciones, 'num_habitaciones'),
        anio_construccion: escalar(d.anio_construccion, 'anio_construccion'),
        zona_centro: d.zona === 'centro' ? 1 : 0,
        zona_suburbio: d.zona === 'suburbio' ? 1 : 0,
        zona_rural: d.zona === 'rural' ? 1 : 0
      };

      // Orden estricto según ENTRADAS_MODELO
      const vectorX = ENTRADAS_MODELO.map(col => mapeo[col]);
      const vectorY = [escalar(d.precio_miles_usd, 'precio_miles_usd')];

      xArr.push(vectorX);
      yArr.push(vectorY);
    }

    return {
      x: tf.tensor2d(xArr),
      y: tf.tensor2d(yArr),
      cantidad: filas.length
    };
  };

  trainData = transformarLote(trainFilas);
  testData = transformarLote(testFilas);

  setEstado(`Listo para Día 2: ${trainData.cantidad} datos de entrenamiento (80%) y ${testData.cantidad} de prueba (20%).`);
  console.log('✅ Preprocesamiento completado exitosamente:');
  console.log('Min/Max calculados:', normalizacion.min, normalizacion.max);
  console.log('Tensor X train shape:', trainData.x.shape);
}