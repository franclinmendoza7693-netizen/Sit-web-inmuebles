// verificarToken: lee "Authorization: Bearer <token>", lo valida con JWT_SECRET
//                 y deja el usuario en req.usuario = { id_usuario, dni, nombres, rol }.
//                 Sin token, inválido o vencido → 401 NO_AUTENTICADO.
// soloRol('admin'): si req.usuario.rol no coincide → 403 SIN_PERMISO.
import jwt from 'jsonwebtoken';
import { fallo } from '../utils/respuesta.js';

export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return fallo(res, 401, 'NO_AUTENTICADO', 'Inicia sesión para continuar');
  }
  try {
    // Se fija el algoritmo con el que firmamos para que no se acepte otro distinto
    req.usuario = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return next();
  } catch (err) {
    const mensaje =
      err instanceof jwt.TokenExpiredError
        ? 'Tu sesión venció, vuelve a iniciar sesión'
        : 'Sesión no válida, vuelve a iniciar sesión';
    return fallo(res, 401, 'NO_AUTENTICADO', mensaje);
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
