// Única puerta de entrada a la API — lo usan Dev B y Dev C — dueño: Dev C
//
//   const data = await api('/inmuebles?zona=centro');
//   const data = await api('/auth/login', { metodo: 'POST', datos: { dni, password } });
//   const data = await api('/inmuebles', { metodo: 'POST', formData });
//
// Devuelve `data` si ok === true. Si no, lanza ApiError { codigo, mensaje, campos, status }.
// Ante NO_AUTENTICADO borra la sesión y redirige a /login.html.
import { API_URL } from './config.js';
import { obtenerSesion, cerrarSesion, irALogin } from './auth.js';

export class ApiError extends Error {
  constructor(codigo, mensaje, campos = {}, status = 0) {
    super(mensaje);
    this.codigo = codigo;
    this.campos = campos;
    this.status = status;
  }
}

export async function api(ruta, { metodo = 'GET', datos, formData } = {}) {
  const headers = {};
  const { token } = obtenerSesion();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (formData) {
    body = formData; // el navegador pone el Content-Type multipart solo
  } else if (datos !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, { method: metodo, headers, body });
  } catch {
    throw new ApiError('ERROR_SERVIDOR', 'No se pudo conectar con el servidor');
  }

  let json;
  try {
    json = await respuesta.json();
  } catch {
    throw new ApiError('ERROR_SERVIDOR', `Respuesta inválida del servidor (${respuesta.status})`, {}, respuesta.status);
  }

  if (json.ok) return json.data;

  const { codigo = 'ERROR_SERVIDOR', mensaje = 'Error desconocido', campos = {} } = json.error || {};
  if (codigo === 'NO_AUTENTICADO') {
    cerrarSesion();
    irALogin();
  }
  throw new ApiError(codigo, mensaje, campos, respuesta.status);
}
