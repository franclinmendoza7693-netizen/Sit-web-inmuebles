// =====================================================================
// client/js/ml/prediccion.js
// ---------------------------------------------------------------------
// Versión simulada: calcula con la fórmula del plan (sección 6.1), sin red neuronal.
// Tiene la firma final de predecirPrecio(), así las páginas no cambian cuando se
// reemplace por el modelo de TensorFlow.js (sección 6.4 del plan).
// TODO: cargar el modelo real de client/assets/model/ con tf.loadLayersModel.
//
//   import { predecirPrecio } from '/js/ml/prediccion.js';
//   const r = await predecirPrecio({ superficie_m2, num_habitaciones, zona, anio_construccion });
//   r → { precio_estimado_usd, rango_min_usd, rango_max_usd, fuera_de_rango, version_modelo }
//   (todo en USD completos)
// =====================================================================

const FACTOR_ZONA = { centro: 1.0, suburbio: 1.05, rural: 0.83 };

export async function cargarModelo() {
  // En la versión real: carga modelo_inmuebles.json + normalizacion.json una sola vez.
}

export async function predecirPrecio(d) {
  await cargarModelo();
  const superficie = Number(d.superficie_m2);
  const habitaciones = Number(d.num_habitaciones);
  const anio = Number(d.anio_construccion);
  const factor = FACTOR_ZONA[d.zona] ?? 1;

  // Misma fórmula del dataset (sección 6.1), sin ruido, en miles de USD
  const miles = Math.max(30, 2.2 * superficie * factor + 8 * habitaciones + 2 * (anio - 2000));
  const precio = Math.round(miles * 1000); // ÚNICO lugar del proyecto con ×1000

  return {
    precio_estimado_usd: precio,
    rango_min_usd: Math.round(precio * 0.94),
    rango_max_usd: Math.round(precio * 1.06),
    fuera_de_rango: superficie < 40 || superficie > 400 || habitaciones > 6 || anio < 1970,
    version_modelo: 'mock',
  };
}
