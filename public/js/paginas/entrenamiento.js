// Entrenamiento del modelo (admin/entrenamiento.html) — dueño: Dev B (días 1, 2 y 4)
// tf (TensorFlow.js), tfvis (tfjs-vis) y Papa (Papa Parse) llegan como globales por CDN.
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
import { ENTRADAS_MODELO } from '/shared/contrato.js';
// import { api } from '../api.js';

if (protegerPagina({ rol: 'admin' })) renderNavbar();

console.log('Entradas del modelo:', ENTRADAS_MODELO, '· TF.js', globalThis.tf?.version?.tfjs);

// TODO (Dev B) — sección 6 del plan:
// Día 1: cargar /admin/datos/inmuebles.csv con Papa.parse(url, { download: true, header: true, dynamicTyping: true })
// Día 2:
//   1. One-hot de zona y min-max de superficie, habitaciones, año y precio (min/max SOLO del set de entrenamiento)
//   2. Separación 80/20 con semilla fija
//   3. Modelo: dense(16, relu, inputShape [6]) → dense(8, relu) → dense(1)
//      compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError', metrics: ['mae'] })
//   4. fit con epochs 150, batchSize 32, validationSplit 0.2,
//      callbacks: [tfvis.show.fitCallbacks(...), tf.callbacks.earlyStopping({ patience: 15 })]
//   5. Métricas en test (USD): MSE, MAE, RMSE, R²; repetir con dense(1) como línea base
//   6. await modelo.save('downloads://modelo_inmuebles') y descargar normalizacion.json
//   7. Copiar los 3 archivos a public/modelo/ y subirlos por PR (subir version_modelo)
// Día 4: sumar las filas de api('/dataset/entrenamiento') (precio_venta_usd / 1000) y reentrenar
