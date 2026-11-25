import { fallo } from '../utils/respuesta.js';

// Cada dato debe llegar como un valor único. Sin esto, "?orden=a&orden=b" o un objeto en el JSON
// pasan las reglas (se revisan elemento por elemento) y terminan en la base o en un error 500.
export function exigirValoresSimples(req, res, next) {
  const campos = {};
  for (const [nombre, valor] of Object.entries({ ...req.query, ...req.body })) {
    if (valor !== null && typeof valor === 'object') campos[nombre] = 'Envía un solo valor';
  }
  if (Object.keys(campos).length > 0) {
    return fallo(res, 400, 'VALIDACION', 'Revisa los datos ingresados', campos);
  }
  return next();
}
