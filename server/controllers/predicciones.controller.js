import { matchedData } from 'express-validator';
import { creado, ok } from '../utils/respuesta.js';
import * as Prediccion from '../models/prediccion.model.js';

// POST /api/predicciones
// matchedData deja pasar solo los campos validados; el dueño sale siempre del token.
export async function registrar(req, res) {
  const datos = matchedData(req, { locations: ['body'] });
  const id_prediccion = await Prediccion.crear({ ...datos, id_usuario: req.usuario.id_usuario });
  return creado(res, { id_prediccion }, 'Consulta guardada');
}

// GET /api/predicciones/mias
export async function listarMias(req, res) {
  const items = await Prediccion.listarPorUsuario(req.usuario.id_usuario);
  return ok(res, { items });
}
