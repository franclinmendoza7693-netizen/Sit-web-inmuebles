// Barra de navegación común — dueño: Dev C
// Cada página tiene <header id="navbar"></header> y llama renderNavbar() al cargar.
import { obtenerSesion, cerrarSesion } from '../auth.js';

export function renderNavbar() {
  const contenedor = document.getElementById('navbar');
  if (!contenedor) return;
  const { usuario } = obtenerSesion();

  const enlacesPrivados = usuario
    ? `
      <li class="nav-item"><a class="nav-link" href="/predecir.html">Estimar precio</a></li>
      <li class="nav-item"><a class="nav-link" href="/publicar.html">Publicar</a></li>
      <li class="nav-item"><a class="nav-link" href="/panel.html">Mi panel</a></li>
      ${usuario.rol === 'admin' ? '<li class="nav-item"><a class="nav-link" href="/admin/entrenamiento.html">Modelo</a></li>' : ''}`
    : '';

  const zonaSesion = usuario
    ? `<span class="navbar-text me-3"><i class="bi bi-person-circle"></i> <span id="navbar-nombre"></span></span>
       <button class="btn btn-outline-light btn-sm" id="btn-cerrar-sesion">Salir</button>`
    : `<a class="btn btn-outline-light btn-sm me-2" href="/login.html">Ingresar</a>
       <a class="btn btn-light btn-sm" href="/registro.html">Registrarme</a>`;

  contenedor.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark ip-navbar">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="/index.html"><i class="bi bi-house-heart"></i> InmoPredict</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-principal"
          aria-controls="menu-principal" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu-principal">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" href="/index.html">Catálogo</a></li>
            ${enlacesPrivados}
          </ul>
          <div class="d-flex align-items-center">${zonaSesion}</div>
        </div>
      </div>
    </nav>`;

  // textContent (no innerHTML) para datos que vienen del usuario
  const nombre = contenedor.querySelector('#navbar-nombre');
  if (nombre) nombre.textContent = usuario.nombres;

  contenedor.querySelector('#btn-cerrar-sesion')?.addEventListener('click', () => {
    cerrarSesion();
    location.href = '/index.html';
  });
}
