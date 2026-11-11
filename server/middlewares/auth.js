// Autenticación con JWT — dueño: Dev A (día 2)
//
// verificarToken: lee "Authorization: Bearer <token>", lo valida con JWT_SECRET
//                 y deja el usuario en req.usuario = { id_usuario, dni, nombres, rol }.
//                 Sin token o vencido → 401 NO_AUTENTICADO.
// soloRol('admin'): si req.usuario.rol no coincide → 403 SIN_PERMISO.
import jwt from 'jsonwebtoken';
import { fallo } from '../utils/respuesta.js';

export function verificarToken(req, res, next) {
  // TODO (Dev A, día 2): revisar y probar con Postman
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return fallo(res, 401, 'NO_AUTENTICADO', 'Inicia sesión para continuar');
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return fallo(res, 401, 'NO_AUTENTICADO', 'Tu sesión venció, vuelve a iniciar sesión');
  }
}

export function soloRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return fallo(res, 403, 'SIN_PERMISO', 'No tienes permiso para esta acción');
    }
    return next();
  };
}
