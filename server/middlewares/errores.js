// Manejo uniforme de errores
import { LIMITES } from '../../shared/contrato.js';
import { ApiError, fallo } from '../utils/respuesta.js';

// Errores que lanza multer, escritos para quien sube las fotos
const MENSAJES_FOTOS = {
  LIMIT_FILE_SIZE: `Cada foto debe pesar como máximo ${LIMITES.fotos.mb} MB`,
  LIMIT_FILE_COUNT: `Puedes subir como máximo ${LIMITES.fotos.max} fotos`,
  LIMIT_UNEXPECTED_FILE: `Envía como máximo ${LIMITES.fotos.max} fotos, en el campo "fotos"`,
};

export function noEncontrado(req, res) {
  return fallo(res, 404, 'NO_ENCONTRADO', `No existe la ruta ${req.method} ${req.originalUrl}`);
}

// Express 5 envía aquí también los errores de funciones async (no hace falta try/catch en cada controlador)
// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, req, res, next) {
  if (err instanceof ApiError) {
    return fallo(res, err.status, err.codigo, err.message, err.campos);
  }
  if (MENSAJES_FOTOS[err.code]) {
    return fallo(res, 400, 'VALIDACION', 'Revisa las fotos', { fotos: MENSAJES_FOTOS[err.code] });
  }
  console.error(err); // el detalle solo va al log, nunca al cliente
  return fallo(res, 500, 'ERROR_SERVIDOR', 'Ocurrió un error inesperado');
}
