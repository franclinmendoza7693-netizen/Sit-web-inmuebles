/**
 * InmoPredict — Cliente HTTP centralizado
 */
import { API_URL } from './config.js';
import { obtenerToken, cerrarSesion } from './auth.js';

export class ApiError extends Error {
  constructor(codigo, mensaje, campos = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.codigo = codigo;
    this.campos = campos;
  }
}

export async function api(ruta, { metodo = 'GET', datos, formData } = {}) {
  const url = ruta.startsWith('http') ? ruta : `${API_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  const headers = {};

  const token = obtenerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opciones = {
    method: metodo.toUpperCase(),
    headers
  };

  if (formData) {
    opciones.body = formData;
  } else if (datos !== undefined) {
    headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new ApiError('ERROR_CONEXION', 'No se pudo conectar con el servidor.');
  }

  if (respuesta.status === 401) {
    cerrarSesion();
    throw new ApiError('NO_AUTENTICADO', 'Tu sesión ha expirado. Ingresa de nuevo.');
  }

  let resultado;
  try {
    resultado = await respuesta.json();
  } catch {
    throw new ApiError('ERROR_SERVIDOR', `Error interno del servidor (${respuesta.status}).`);
  }

  if (resultado.ok === true) {
    return resultado.data;
  }

  const err = resultado.error || {};
  throw new ApiError(
    err.codigo || 'ERROR_SERVIDOR',
    err.mensaje || 'Error al procesar la solicitud',
    err.campos || {}
  );
}
