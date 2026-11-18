import { ENTRADAS_MODELO } from '/shared/contrato.js';
import { MODELO_URL, NORMALIZACION_URL } from '../config.js';
import { escalar, desescalar, fueraDeRango, vectorizar } from './preprocesamiento.js';

let modelo = null;
let norm = null;

/**
 * Carga el modelo de TensorFlow.js y los metadatos de normalización.
 * Se descarga una sola vez y queda en memoria.
 */
export async function cargarModelo() {
  if (!modelo) {
    try {
      const [modeloCargado, normCargada] = await Promise.all([
        tf.loadLayersModel(MODELO_URL),
        fetch(NORMALIZACION_URL).then((r) => {
          if (!r.ok) throw new Error(`No se pudo cargar ${NORMALIZACION_URL}`);
          return r.json();
        }),
      ]);
      modelo = modeloCargado;
      norm = normCargada;
      console.log('✅ Red Neuronal y normalización cargadas en memoria.');
    } catch (err) {
      console.error('Error al cargar el modelo de TensorFlow.js:', err);
      throw err;
    }
  }
  return { modelo, norm };
}

/**
 * Inferencia en tiempo real.
 * Recibe: { superficie_m2, num_habitaciones, zona, anio_construccion }
 * Devuelve: { precio_estimado_usd, rango_min_usd, rango_max_usd, fuera_de_rango, version_modelo }
 */
export async function predecirPrecio(d) {
  await cargarModelo();

  const fila = {
    superficie_m2: Number(d.superficie_m2),
    num_habitaciones: Number(d.num_habitaciones),
    anio_construccion: Number(d.anio_construccion),
    zona: String(d.zona ?? '').trim().toLowerCase(),
  };

  // 1. Vectorizar la entrada respetando el orden estricto de ENTRADAS_MODELO
  const vector = vectorizar(fila, norm);

  // 2. Predecir con TensorFlow.js
  const salida = tf.tidy(() => {
    const tensorInput = tf.tensor2d([vector]);
    return modelo.predict(tensorInput).dataSync()[0];
  });

  // 3. Desescalar a miles de USD
  const p = 'precio_miles_usd';
  const miles = desescalar(salida, p, norm);

  // 4. Conversión x1000 a USD completos (ÚNICO lugar del proyecto con x1000)
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