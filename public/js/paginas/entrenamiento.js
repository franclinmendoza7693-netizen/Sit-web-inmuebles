// =====================================================================
// Entrenamiento del modelo (admin/entrenamiento.html) — dueño: Dev B
// ---------------------------------------------------------------------
// tf (TensorFlow.js), tfvis (tfjs-vis) y Papa (Papa Parse) llegan como
// globales por CDN desde el HTML: no se importan.
//
// Día 1 (hecho): cargar el CSV, revisar el dataset y preprocesar (80/20, min-max, one-hot).
// Día 2: entrenar, evaluar y exportar (botones 2, 3 y 4).
// =====================================================================
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
import { ENTRADAS_MODELO, ETIQUETAS } from '/shared/contrato.js';
import {
  COLUMNAS_NUMERICAS,
  OBJETIVO,
  limpiarFilas,
  prepararDatos,
  resumir,
  vectorizar,
  fueraDeRango,
} from '../modelo/preprocesamiento.js';
import { CASOS_ENUNCIADO } from '../modelo/casos-enunciado.js';

const RUTA_CSV = '/admin/datos/inmuebles.csv';

// Mientras no exista el login (lo hace Dev A el día 2), la página se abre sin sesión.
// TODO (día 2, cuando el login funcione): cambiar a true para que solo entre el admin.
const REQUIERE_ADMIN = false;

if (!REQUIERE_ADMIN || protegerPagina({ rol: 'admin' })) renderNavbar();

// Estado compartido entre los pasos (el día 2 se agregan modelo y métricas)
const estado = { filas: null, datos: null };

const $ = (id) => document.getElementById(id);
const txtEstado = $('estado-entrenamiento');
const zonaMetricas = $('metricas-modelo');
const zonaGraficos = $('graficos-entrenamiento');
const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });
const sinMiles = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1, useGrouping: false }); // años: 1970, no 1,970

const NOMBRES = {
  superficie_m2: 'Superficie (m²)',
  num_habitaciones: 'Habitaciones',
  anio_construccion: 'Año de construcción',
  precio_miles_usd: 'Precio (miles USD)',
};

// Los pasos del día 2 quedan desactivados por ahora
for (const id of ['btn-entrenar', 'btn-evaluar', 'btn-exportar']) {
  $(id).disabled = true;
  $(id).title = 'Disponible desde el día 2';
}

$('btn-cargar-datos').addEventListener('click', cargarDatos);

// ---------------------------------------------------------------------
// Paso 1: cargar y revisar el dataset
// ---------------------------------------------------------------------
async function cargarDatos() {
  const boton = $('btn-cargar-datos');
  boton.disabled = true;
  txtEstado.textContent = 'Cargando el dataset…';
  zonaMetricas.replaceChildren();
  zonaGraficos.replaceChildren();

  try {
    const crudas = await leerCsv(RUTA_CSV);
    const { validas, descartadas } = limpiarFilas(crudas);
    if (!validas.length) throw new Error('El CSV no tiene filas válidas');

    estado.filas = validas;
    estado.datos = prepararDatos(validas); // separación 80/20 + normalización + vectores

    const { datos } = estado;
    txtEstado.textContent =
      `✔ ${validas.length} filas válidas (${descartadas} descartadas) · ` +
      `entrenamiento ${datos.entrenamiento.length} · prueba ${datos.prueba.length}`;

    mostrarResumen(resumir(validas));
    mostrarNormalizacion(datos);
    mostrarCasosEnunciado(datos.normalizacion);
    mostrarGraficos(validas);

    // Para revisar desde la consola del navegador: inmoDatos.xEntrenamiento, inmoDatos.normalizacion…
    globalThis.inmoDatos = datos;
    console.info('Datos preparados (ver window.inmoDatos):', datos);
  } catch (error) {
    txtEstado.textContent = `✖ ${error.message}`;
    console.error(error);
  } finally {
    boton.disabled = false;
  }
}

function leerCsv(url) {
  return new Promise((resolver, rechazar) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (resultado) => resolver(resultado.data),
      error: (err) => rechazar(new Error(`No se pudo leer ${url}: ${err.message || err}`)),
    });
  });
}

// ---------------------------------------------------------------------
// Vistas
// ---------------------------------------------------------------------
function mostrarResumen(resumen) {
  agregarTitulo(zonaMetricas, 'Resumen del dataset');
  zonaMetricas.append(
    crearTabla(
      ['Columna', 'Mínimo', 'Máximo', 'Promedio'],
      [...COLUMNAS_NUMERICAS, OBJETIVO].map((c) => {
        const formato = c === 'anio_construccion' ? sinMiles : numero;
        return [
          NOMBRES[c],
          formato.format(resumen.columnas[c].min),
          formato.format(resumen.columnas[c].max),
          formato.format(resumen.columnas[c].promedio),
        ];
      }),
    ),
  );
  zonaMetricas.append(
    crearTabla(
      ['Zona', 'Inmuebles', '% del total', 'Precio promedio (miles USD)'],
      Object.entries(resumen.zonas).map(([zona, n]) => [
        ETIQUETAS[zona],
        n,
        `${numero.format((n / resumen.total) * 100)} %`,
        numero.format(resumen.precioPromedioZona[zona]),
      ]),
    ),
  );
}

function mostrarNormalizacion(datos) {
  agregarTitulo(zonaMetricas, 'Preprocesamiento');
  const p = document.createElement('p');
  p.className = 'small text-secondary';
  p.textContent =
    'Min-max calculado solo con el set de entrenamiento. Este bloque es la base de normalizacion.json ' +
    '(el día 2 se le agregan version_modelo y metricas_test).';
  zonaMetricas.append(p);

  const pre = document.createElement('pre');
  pre.className = 'ip-panel small mb-3';
  pre.textContent = JSON.stringify(datos.normalizacion, null, 2);
  zonaMetricas.append(pre);

  const f = datos.entrenamiento[0];
  const ejemplo = document.createElement('p');
  ejemplo.className = 'small';
  ejemplo.textContent =
    `Ejemplo → ${f.superficie_m2} m², ${f.num_habitaciones} hab., ${f.zona}, ${f.anio_construccion}: ` +
    `[${datos.xEntrenamiento[0].map((v) => decimal.format(v)).join(', ')}] ` +
    `→ precio escalado ${decimal.format(datos.yEntrenamiento[0][0])}`;
  zonaMetricas.append(ejemplo);
}

function mostrarCasosEnunciado(norm) {
  agregarTitulo(zonaMetricas, 'Casos del enunciado (aceptación: ±10 %)');
  zonaMetricas.append(
    crearTabla(
      ['Superficie', 'Hab.', 'Zona', 'Año', 'Precio esperado (miles USD)', 'Dentro del rango', 'Vector de entrada'],
      CASOS_ENUNCIADO.map((c) => [
        c.superficie_m2,
        c.num_habitaciones,
        ETIQUETAS[c.zona],
        c.anio_construccion,
        c.precio_miles_usd,
        fueraDeRango(c, norm) ? '✖ no' : '✔ sí',
        `[${vectorizar(c, norm).map((v) => decimal.format(v)).join(', ')}]`,
      ]),
    ),
  );
  const nota = document.createElement('p');
  nota.className = 'small text-secondary';
  nota.textContent = `Orden de entradas: ${ENTRADAS_MODELO.join(', ')}. El día 2 se agrega la columna "Predicción del modelo".`;
  zonaMetricas.append(nota);
}

function mostrarGraficos(filas) {
  agregarTitulo(zonaGraficos, 'Gráficos del dataset');
  const fila = document.createElement('div');
  fila.className = 'row g-3';
  zonaGraficos.append(fila);

  const caja = (titulo, ancho = 'col-12') => {
    const col = document.createElement('div');
    col.className = ancho;
    const h = document.createElement('h3');
    h.className = 'h6 mt-2';
    h.textContent = titulo;
    const lienzo = document.createElement('div');
    col.append(h, lienzo);
    fila.append(col);
    return lienzo;
  };

  // Precio vs. superficie, una serie por zona
  const dispersion = caja('Precio según superficie y zona');
  const series = ['centro', 'suburbio', 'rural'];
  tfvis.render.scatterplot(
    dispersion,
    {
      values: series.map((z) =>
        filas.filter((f) => f.zona === z).map((f) => ({ x: f.superficie_m2, y: f[OBJETIVO] })),
      ),
      series: series.map((z) => ETIQUETAS[z]),
    },
    { xLabel: NOMBRES.superficie_m2, yLabel: NOMBRES.precio_miles_usd, height: 320, width: dispersion.clientWidth || 700 },
  );

  const barras = caja('Inmuebles por zona', 'col-md-6');
  tfvis.render.barchart(
    barras,
    series.map((z) => ({ index: ETIQUETAS[z], value: filas.filter((f) => f.zona === z).length })),
    { xLabel: 'Zona', yLabel: 'Inmuebles', height: 260, width: barras.clientWidth || 340 },
  );

  const histograma = caja('Distribución de precios', 'col-md-6');
  tfvis.render.histogram(
    histograma,
    filas.map((f) => f[OBJETIVO]),
    { xLabel: NOMBRES.precio_miles_usd, height: 260, width: histograma.clientWidth || 340, maxBins: 25 },
  );
}

// ---------------------------------------------------------------------
// Utilidades de interfaz
// ---------------------------------------------------------------------
function agregarTitulo(contenedor, texto) {
  const h = document.createElement('h2');
  h.className = 'h5 mt-4';
  h.textContent = texto;
  contenedor.append(h);
}

function crearTabla(encabezados, filas) {
  const envoltura = document.createElement('div');
  envoltura.className = 'table-responsive mb-3';
  const tabla = document.createElement('table');
  tabla.className = 'table table-sm table-striped align-middle mb-0';
  const thead = tabla.createTHead().insertRow();
  for (const e of encabezados) {
    const th = document.createElement('th');
    th.textContent = e;
    thead.append(th);
  }
  const tbody = tabla.createTBody();
  for (const f of filas) {
    const tr = tbody.insertRow();
    for (const valor of f) tr.insertCell().textContent = valor;
  }
  envoltura.append(tabla);
  return envoltura;
}

// =====================================================================
// TODO (Dev B, día 2) — sección 6.3 del plan
//   1. const xs = tf.tensor2d(estado.datos.xEntrenamiento); const ys = tf.tensor2d(estado.datos.yEntrenamiento);
//   2. Modelo: dense(16, relu, inputShape [6]) → dense(8, relu) → dense(1)
//      compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError', metrics: ['mae'] })
//   3. fit: epochs 150, batchSize 32, validationSplit 0.2,
//      callbacks: [tfvis.show.fitCallbacks(...), tf.callbacks.earlyStopping({ patience: 15 })]
//   4. Evaluar con xPrueba/yPrueba: MSE, MAE, RMSE, R² en USD (desescalar con preprocesamiento.desescalar)
//      y repetir con una sola capa dense(1) como línea base.
//   5. Columna "Predicción del modelo" en la tabla de casos del enunciado.
//   6. Exportar: modelo.save('downloads://modelo_inmuebles') + normalizacion.json
//      ({ version_modelo, entradas, min, max, metricas_test }).
// =====================================================================