// Sesión del usuario en el navegador — dueño: Dev C
import { STORAGE } from '/shared/contrato.js';

export function obtenerSesion() {
  try {
    const token = localStorage.getItem(STORAGE.TOKEN);
    const usuario = JSON.parse(localStorage.getItem(STORAGE.USUARIO) || 'null');
    return { token, usuario };
  } catch {
    return { token: null, usuario: null };
  }
}

// Se llama después de un login exitoso con lo que devuelve POST /api/auth/login
export function guardarSesion({ token, usuario }) {
  localStorage.setItem(STORAGE.TOKEN, token);
  localStorage.setItem(STORAGE.USUARIO, JSON.stringify(usuario));
}

export function cerrarSesion() {
  localStorage.removeItem(STORAGE.TOKEN);
  localStorage.removeItem(STORAGE.USUARIO);
}

export function irALogin() {
  const volver = encodeURIComponent(location.pathname + location.search);
  location.href = `/login.html?volver=${volver}`;
}

// Al inicio de una página privada: protegerPagina()  |  solo admin: protegerPagina({ rol: 'admin' })
export function protegerPagina({ rol } = {}) {
  const { token, usuario } = obtenerSesion();
  if (!token || !usuario) {
    irALogin();
    return null;
  }
  if (rol && usuario.rol !== rol) {
    location.href = '/index.html';
    return null;
  }
  return usuario;
}
