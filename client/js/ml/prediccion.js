// Inferencia en el navegador con TensorFlow.js (único punto donde el modelo ×1000 pasa a USD)
import { MODELO_URL, NORMALIZACION_URL } from '../config.js';
import { desescalar, fueraDeRango, vectorizar } from './preprocesamiento.js';

let modelo = null;
let norm = null;

export async function cargarModelo() {
  if (!modelo) {
    const [modeloCargado, normCargada] = await Promise.all([
      tf.loadLayersModel(MODELO_URL),
      fetch(NORMALIZACION_URL).then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${NORMALIZACION_URL}`);
        return r.json();
      }),
    ]);
    modelo = modeloCargado;
    norm = normCargada;
  }
  return { modelo, norm };
}

export async function predecirPrecio(d) {
  await cargarModelo();

  const fila = {
    superficie_m2: Number(d.superficie_m2),
    num_habitaciones: Number(d.num_habitaciones),
    anio_construccion: Number(d.anio_construccion),
    zona: String(d.zona ?? '').trim().toLowerCase(),
  };

  const vector = vectorizar(fila, norm);

  const salida = tf.tidy(() => {
    const tensorInput = tf.tensor2d([vector]);
    return modelo.predict(tensorInput).dataSync()[0];
  });

  const miles = desescalar(salida, 'precio_miles_usd', norm);
  const precio = Math.round(miles * 1000);
  const margen = norm.metricas_test?.mae_usd || 16000;

  return {
    precio_estimado_usd: precio,
    rango_min_usd: Math.max(0, precio - margen),
    rango_max_usd: precio + margen,
    fuera_de_rango: fueraDeRango(fila, norm),
    version_modelo: norm.version_modelo || '1.0.0',
  };
}