// =====================================================================
// Entrenamiento del modelo (admin/entrenamiento.html)
// ---------------------------------------------------------------------
// tf (TensorFlow.js), tfvis (tfjs-vis) y Papa (Papa Parse) llegan como
// globales por CDN desde el HTML: no se importan.
//
// Carga el CSV, divide 80/20, normaliza (min-max, one-hot), entrena la red neuronal,
// la evalúa contra la línea base (regresión lineal) y exporta el modelo.
// =====================================================================
import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';
import { ENTRADAS_MODELO, ETIQUETAS } from '/shared/contrato.js';
import {
  COLUMNAS_NUMERICAS,
  OBJETIVO,
  limpiarFilas,
  prepararDatos,
  resumir,
  vectorizar,
  desescalar,
  fueraDeRango,
} from '../ml/preprocesamiento.js';
import { CASOS_ENUNCIADO } from '../ml/casos-enunciado.js';

const RUTA_CSV = '/assets/data/inmuebles.csv';

if (protegerPagina({ rol: 'admin' })) renderNavbar();

// Estado compartido del entrenamiento y evaluación
const estado = {
  filas: null,
  datos: null,
  modelo: null,
  lineaBase: null,
  metricasRed: null,
  metricasLineaBase: null,
};

const $ = (id) => document.getElementById(id);
const txtEstado = $('estado-entrenamiento');
const zonaMetricas = $('metricas-modelo');
const zonaGraficos = $('graficos-entrenamiento');

const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });
const sinMiles = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1, useGrouping: false });
const formatoDolar = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const NOMBRES = {
  superficie_m2: 'Superficie (m²)',
  num_habitaciones: 'Habitaciones',
  anio_construccion: 'Año de construcción',
  precio_miles_usd: 'Precio (miles USD)',
};

// Listeners de los 4 pasos
$('btn-cargar-datos').addEventListener('click', cargarDatos);
$('btn-entrenar').addEventListener('click', entrenarModelo);
$('btn-evaluar').addEventListener('click', evaluarModelos);
$('btn-exportar').addEventListener('click', exportarArchivos);

// Inicialmente los botones 2, 3 y 4 quedan deshabilitados hasta cargar datos
$('btn-entrenar').disabled = true;
$('btn-evaluar').disabled = true;
$('btn-exportar').disabled = true;

// =====================================================================
// PASO 1: Cargar datos
// =====================================================================
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
    estado.datos = prepararDatos(validas);

    const { datos } = estado;
    txtEstado.textContent =
      `✔ ${validas.length} filas válidas (${descartadas} descartadas) · ` +
      `entrenamiento ${datos.entrenamiento.length} · prueba ${datos.prueba.length}`;

    mostrarResumen(resumir(validas));
    mostrarNormalizacion(datos);
    mostrarCasosEnunciado(datos.normalizacion);
    mostrarGraficos(validas);

    globalThis.inmoDatos = datos;
    $('btn-entrenar').disabled = false;
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
      complete: (res) => resolver(res.data),
      error: (err) => rechazar(new Error(`No se pudo leer ${url}: ${err.message || err}`)),
    });
  });
}

// =====================================================================
// PASO 2: Entrenar Red Neuronal (6 -> 16 -> 8 -> 1)
// =====================================================================
async function entrenarModelo() {
  if (!estado.datos) return;
  const btn = $('btn-entrenar');
  btn.disabled = true;
  txtEstado.textContent = 'Entrenando Red Neuronal con TensorFlow.js...';

  // 1. Convertir arreglos preprocesados a Tensores 2D
  const xs = tf.tensor2d(estado.datos.xEntrenamiento);
  const ys = tf.tensor2d(estado.datos.yEntrenamiento);

  // 2. Definir arquitectura: 6 -> 16 (relu) -> 8 (relu) -> 1 (linear)
  const red = tf.sequential();
  red.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [6] }));
  red.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  red.add(tf.layers.dense({ units: 1, activation: 'linear' }));

  red.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae'],
  });

  // Callbacks para visor visual (tfjs-vis) y parada temprana
  const visor = tfvis.visor();
  if (!visor.isOpen()) visor.open();

  const fitCallbacks = tfvis.show.fitCallbacks(
    { name: 'Curvas de Entrenamiento (Red Neuronal)', tab: 'Entrenamiento' },
    ['loss', 'val_loss', 'mae', 'val_mae'],
    { callbacks: ['onEpochEnd'] }
  );

  // Implementación segura de parada temprana (evita el bug de getMonitorValue en TF.js)
  let mejorPerdida = Infinity;
  let paciencia = 15;
  let conteoSinMejora = 0;

  const controlParada = {
    onEpochEnd: async (epoch, logs) => {
      if (logs.val_loss < mejorPerdida) {
        mejorPerdida = logs.val_loss;
        conteoSinMejora = 0;
      } else {
        conteoSinMejora++;
        if (conteoSinMejora >= paciencia) {
          console.log(`Parada temprana en época ${epoch + 1}: val_loss dejó de mejorar.`);
          red.stopTraining = true;
        }
      }
    }
  };

  try {
    await red.fit(xs, ys, {
      epochs: 150,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: [fitCallbacks, controlParada],
    });

    estado.modelo = red;
    txtEstado.textContent = '✔ Red Neuronal entrenada. Procede al Paso 3: Evaluar.';
    $('btn-evaluar').disabled = false;
  } catch (err) {
    txtEstado.textContent = `✖ Error al entrenar: ${err.message}`;
    console.error(err);
  } finally {
    xs.dispose();
    ys.dispose();
    btn.disabled = false;
  }
}

// =====================================================================
// PASO 3: Evaluar (Red vs Línea Base) y Casos de Aceptación
// =====================================================================
async function evaluarModelos() {
  if (!estado.modelo || !estado.datos) return;
  const btn = $('btn-evaluar');
  btn.disabled = true;
  txtEstado.textContent = 'Evaluando Red Neuronal y entrenando Línea Base (Regresión Lineal)...';

  try {
    const { normalizacion, xEntrenamiento, yEntrenamiento, xPrueba, yPrueba } = estado.datos;

    // 1. Entrenar Línea Base (dense 1 sola neurona) para justificar la red en el informe
    const lineaBase = tf.sequential();
    lineaBase.add(tf.layers.dense({ units: 1, activation: 'linear', inputShape: [6] }));
    lineaBase.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError', metrics: ['mae'] });

    const xsTrain = tf.tensor2d(xEntrenamiento);
    const ysTrain = tf.tensor2d(yEntrenamiento);
    await lineaBase.fit(xsTrain, ysTrain, { epochs: 60, batchSize: 32, verbose: 0 });
    xsTrain.dispose();
    ysTrain.dispose();
    estado.lineaBase = lineaBase;

    // 2. Calcular métricas en USD sobre el 20% de prueba (test)
    const xsTest = tf.tensor2d(xPrueba);
    const predsRed = estado.modelo.predict(xsTest).dataSync();
    const predsLB = estado.lineaBase.predict(xsTest).dataSync();
    xsTest.dispose();

    const yTestRealMiles = yPrueba.map((y) => desescalar(y[0], OBJETIVO, normalizacion));
    const predsRedUSD = Array.from(predsRed).map((p) => Math.round(desescalar(p, OBJETIVO, normalizacion) * 1000));
    const predsLbUSD = Array.from(predsLB).map((p) => Math.round(desescalar(p, OBJETIVO, normalizacion) * 1000));
    const realesUSD = yTestRealMiles.map((y) => Math.round(y * 1000));

    estado.metricasRed = calcularMetricas(realesUSD, predsRedUSD);
    estado.metricasLineaBase = calcularMetricas(realesUSD, predsLbUSD);

    // 3. Evaluar los 5 casos del enunciado con la Red
    const prediccionesEnunciado = CASOS_ENUNCIADO.map((c) => {
      const vec = vectorizar(c, normalizacion);
      const salidaNorm = tf.tidy(() => estado.modelo.predict(tf.tensor2d([vec])).dataSync()[0]);
      const predMiles = desescalar(salidaNorm, OBJETIVO, normalizacion);
      const predUSD = Math.round(predMiles * 1000);
      const esperadoUSD = c.precio_miles_usd * 1000;
      const difPct = ((predUSD - esperadoUSD) / esperadoUSD) * 100;
      return {
        ...c,
        predUSD,
        difPct,
        cumple: Math.abs(difPct) <= 10,
      };
    });

    mostrarResultadosEvaluacion(prediccionesEnunciado);
    txtEstado.textContent = '✔ Evaluación completada. Revisa las métricas y exporta el modelo.';
    $('btn-exportar').disabled = false;
  } catch (err) {
    txtEstado.textContent = `✖ Error al evaluar: ${err.message}`;
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

function calcularMetricas(reales, predichos) {
  const n = reales.length;
  let sumaErrorAbs = 0;
  let sumaErrorCuad = 0;
  let sumaReales = 0;

  for (let i = 0; i < n; i++) {
    const error = predichos[i] - reales[i];
    sumaErrorAbs += Math.abs(error);
    sumaErrorCuad += error * error;
    sumaReales += reales[i];
  }

  const promedioReal = sumaReales / n;
  let ssTot = 0;
  for (let i = 0; i < n; i++) ssTot += Math.pow(reales[i] - promedioReal, 2);

  const mae = Math.round(sumaErrorAbs / n);
  const mse = Math.round(sumaErrorCuad / n);
  const rmse = Math.round(Math.sqrt(mse));
  const r2 = Number((1 - sumaErrorCuad / ssTot).toFixed(4));
  const errorPct = Number(((mae / promedioReal) * 100).toFixed(2));

  return { mae, mse, rmse, r2, errorPct, promedioReal };
}

// =====================================================================
// PASO 4: Exportar modelo y normalización
// =====================================================================
async function exportarArchivos() {
  if (!estado.modelo || !estado.datos || !estado.metricasRed) return;
  const btn = $('btn-exportar');
  btn.disabled = true;
  txtEstado.textContent = 'Exportando modelo y normalización...';

  try {
    // 1. Descargar modelo_inmuebles.json y modelo_inmuebles.weights.bin
    await estado.modelo.save('downloads://modelo_inmuebles');

    // 2. Construir objeto normalizacion.json oficial (sección 6.2 del plan)
    const { normalizacion } = estado.datos;
    const objetoNormalizacion = {
      version_modelo: '1.0.0',
      entradas: ENTRADAS_MODELO,
      min: normalizacion.min,
      max: normalizacion.max,
      metricas_test: {
        mse: estado.metricasRed.mse,
        mae_usd: estado.metricasRed.mae,
        rmse_usd: estado.metricasRed.rmse,
        r2: estado.metricasRed.r2,
      },
    };

    // Descargar normalizacion.json
    const blob = new Blob([JSON.stringify(objetoNormalizacion, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'normalizacion.json';
    link.click();
    URL.revokeObjectURL(link.href);

    txtEstado.textContent =
      '✔ ¡Archivos descargados! Copia los 3 archivos desde Descargas hacia tu carpeta client/assets/model/';
  } catch (err) {
    txtEstado.textContent = `✖ Error al exportar: ${err.message}`;
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

// =====================================================================
// Vistas auxiliares
// =====================================================================
function mostrarResultadosEvaluacion(casos) {
  agregarTitulo(zonaMetricas, 'Comparativa de Modelos en Test (20% no visto)');

  const red = estado.metricasRed;
  const lb = estado.metricasLineaBase;

  const tablaComp = crearTabla(
    ['Modelo', 'R² (Meta > 0.90)', 'MAE (Error medio en USD)', 'Error % sobre precio medio', 'RMSE'],
    [
      [
        'Red Neuronal (6 → 16 → 8 → 1)',
        `${red.r2} ${red.r2 >= 0.9 ? '✔ Cumple' : '✖'}`,
        formatoDolar.format(red.mae),
        `${red.errorPct} % ${red.errorPct < 6 ? '✔ (< 6%)' : ''}`,
        formatoDolar.format(red.rmse),
      ],
      [
        'Línea Base (Regresión Lineal)',
        `${lb.r2}`,
        formatoDolar.format(lb.mae),
        `${lb.errorPct} %`,
        formatoDolar.format(lb.rmse),
      ],
    ]
  );
  zonaMetricas.append(tablaComp);

  agregarTitulo(zonaMetricas, 'Casos de Aceptación del Enunciado (Tolerancia ±10 %)');
  const tablaCasos = crearTabla(
    ['Superficie', 'Hab.', 'Zona', 'Año', 'Esperado (USD)', 'Predicción Red (USD)', 'Diferencia %', 'Aceptación'],
    casos.map((c) => [
      `${c.superficie_m2} m²`,
      c.num_habitaciones,
      ETIQUETAS[c.zona],
      c.anio_construccion,
      formatoDolar.format(c.precio_miles_usd * 1000),
      formatoDolar.format(c.predUSD),
      `${c.difPct > 0 ? '+' : ''}${c.difPct.toFixed(1)} %`,
      c.cumple ? '✔ Cumple (≤ 10%)' : '✖ Fuera de rango',
    ])
  );
  zonaMetricas.append(tablaCasos);
}

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
      })
    )
  );
}

function mostrarNormalizacion(datos) {
  agregarTitulo(zonaMetricas, 'Preprocesamiento');
  const pre = document.createElement('pre');
  pre.className = 'ip-panel small mb-3';
  pre.textContent = JSON.stringify(datos.normalizacion, null, 2);
  zonaMetricas.append(pre);
}

function mostrarCasosEnunciado(norm) {
  agregarTitulo(zonaMetricas, 'Casos del enunciado (datos base)');
  zonaMetricas.append(
    crearTabla(
      ['Superficie', 'Hab.', 'Zona', 'Año', 'Esperado (miles USD)', 'Vector entrada'],
      CASOS_ENUNCIADO.map((c) => [
        c.superficie_m2,
        c.num_habitaciones,
        ETIQUETAS[c.zona],
        c.anio_construccion,
        c.precio_miles_usd,
        `[${vectorizar(c, norm).map((v) => decimal.format(v)).join(', ')}]`,
      ])
    )
  );
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

  const dispersion = caja('Precio según superficie y zona');
  const series = ['centro', 'suburbio', 'rural'];
  tfvis.render.scatterplot(
    dispersion,
    {
      values: series.map((z) =>
        filas.filter((f) => f.zona === z).map((f) => ({ x: f.superficie_m2, y: f[OBJETIVO] }))
      ),
      series: series.map((z) => ETIQUETAS[z]),
    },
    { xLabel: NOMBRES.superficie_m2, yLabel: NOMBRES.precio_miles_usd, height: 320, width: dispersion.clientWidth || 700 }
  );
}

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