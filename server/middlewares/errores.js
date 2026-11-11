// Manejo uniforme de errores — dueño: Dev A
import { ApiError, fallo } from '../utils/respuesta.js';

export function noEncontrado(req, res) {
  return fallo(res, 404, 'NO_ENCONTRADO', `No existe la ruta ${req.method} ${req.originalUrl}`);
}

// Express 5 envía aquí también los errores de funciones async (no hace falta try/catch en cada controlador)
// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, req, res, next) {
  if (err instanceof ApiError) {
    return fallo(res, err.status, err.codigo, err.message, err.campos);
  }
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT') {
    return fallo(res, 400, 'VALIDACION', 'Fotos fuera de los límites permitidos', {
      fotos: err.message,
    });
  }
  console.error(err); // el detalle solo va al log, nunca al cliente
  return fallo(res, 500, 'ERROR_SERVIDOR', 'Ocurrió un error inesperado');
}
