// Controlador de predicciones — dueño: Dev A (día 3)
import { pendiente } from '../utils/respuesta.js';
// import * as Prediccion from '../models/prediccion.model.js';

// POST /api/predicciones
// body: superficie_m2, num_habitaciones, zona, anio_construccion, precio_estimado_usd, version_modelo
// → creado(res, { id_prediccion })
export async function registrar(req, res) {
  return pendiente(res);
}

// GET /api/predicciones/mias → ok(res, { items })  (más recientes primero)
export async function listarMias(req, res) {
  return pendiente(res);
}
