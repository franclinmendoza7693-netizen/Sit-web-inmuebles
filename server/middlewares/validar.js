// Convierte los errores de express-validator al sobre del contrato — dueño: Dev A
//
// Uso en una ruta:
//   import { body } from 'express-validator';
//   import { REGEX, MENSAJES } from '../../shared/contrato.js';
//   router.post('/registro', [body('dni').matches(REGEX.dni).withMessage(MENSAJES.dni)], validar, registro);
import { validationResult } from 'express-validator';
import { fallo } from '../utils/respuesta.js';

export function validar(req, res, next) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();

  const campos = {};
  for (const e of resultado.array()) {
    if (!campos[e.path]) campos[e.path] = e.msg; // un mensaje por campo, con el mismo nombre del input
  }
  return fallo(res, 400, 'VALIDACION', 'Revisa los datos ingresados', campos);
}
