// Exportación del catálogo como dataset — dueño: Dev A (día 4)
import { pendiente } from '../utils/respuesta.js';

// GET /api/dataset/entrenamiento (solo admin)
// → ok(res, { filas: [{ superficie_m2, num_habitaciones, zona, anio_construccion, precio_venta_usd }] })
// Incluir inmuebles en estado 'publicado' o 'vendido'.
export async function exportarEntrenamiento(req, res) {
  return pendiente(res);
}
