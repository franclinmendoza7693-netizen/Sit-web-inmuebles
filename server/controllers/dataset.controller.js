import { ok } from '../utils/respuesta.js';
import * as Inmueble from '../models/inmueble.model.js';

// GET /api/dataset/entrenamiento
export async function exportarEntrenamiento(req, res) {
  const filas = await Inmueble.listarParaEntrenamiento();
  return ok(res, { filas });
}
