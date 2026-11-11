// Sobre único de respuesta de la API (sección 5 del plan) — dueño: Dev A
//   Éxito: { ok: true,  data, mensaje }
//   Error: { ok: false, error: { codigo, mensaje, campos } }

export function ok(res, data = null, mensaje = 'OK', status = 200) {
  return res.status(status).json({ ok: true, data, mensaje });
}

export function creado(res, data = null, mensaje = 'Creado') {
  return ok(res, data, mensaje, 201);
}

export function fallo(res, status, codigo, mensaje, campos) {
  const error = { codigo, mensaje };
  if (campos) error.campos = campos;
  return res.status(status).json({ ok: false, error });
}

// Error que se puede lanzar desde cualquier capa: throw new ApiError(404, 'NO_ENCONTRADO', '…')
export class ApiError extends Error {
  constructor(status, codigo, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

// Respuesta temporal mientras un endpoint no está hecho. Borrar cuando todos existan.
export function pendiente(res, quien = 'Dev A') {
  return fallo(res, 501, 'ERROR_SERVIDOR', `Endpoint pendiente de implementar (${quien})`);
}
