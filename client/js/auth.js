/**
 * InmoPredict — Módulo de Sesión y Autenticación Frontend
 * Usa las constantes sagradas de shared/contrato.js
 */
import { STORAGE } from '/shared/contrato.js';

export function guardarSesion({ token, usuario }) {
  if (token) {
    localStorage.setItem(STORAGE.TOKEN, token);
  }
  if (usuario) {
    localStorage.setItem(STORAGE.USUARIO, JSON.stringify(usuario));
  }
}

export function obtenerToken() {
  return localStorage.getItem(STORAGE.TOKEN);
}

export function obtenerUsuario() {
  const data = localStorage.getItem(STORAGE.USUARIO);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    cerrarSesion();
    return null;
  }
}

export function estaAutenticado() {
  return Boolean(obtenerToken() && obtenerUsuario());
}

export function cerrarSesion(redir = '/login.html') {
  localStorage.removeItem(STORAGE.TOKEN);
  localStorage.removeItem(STORAGE.USUARIO);
  localStorage.removeItem(STORAGE.PREDICCION_PENDIENTE);
  window.location.href = redir;
}

export function protegerPagina({ rol } = {}) {
  if (!estaAutenticado()) {
    const destino = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?redir=${destino}`;
    return null;
  }

  const usuario = obtenerUsuario();
  if (rol && usuario.rol !== rol) {
    alert('No cuentas con permisos para entrar a esta sección.');
    window.location.href = '/index.html';
    return null;
  }

  return usuario;
}
