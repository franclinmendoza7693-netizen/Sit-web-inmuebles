/**
 * InmoPredict — Navbar dinámico según rol y sesión
 */
import { estaAutenticado, obtenerUsuario, cerrarSesion } from '../auth.js';

export function renderNavbar() {
  const contenedor = document.getElementById('navbar');
  if (!contenedor) return;

  const autenticado = estaAutenticado();
  const usuario = autenticado ? obtenerUsuario() : null;
  const path = window.location.pathname;

  const nav = document.createElement('nav');
  nav.className = 'navbar navbar-expand-lg ip-navbar navbar-dark shadow-sm';
  nav.setAttribute('aria-label', 'Navegación principal');

  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="/index.html">
        <i class="bi bi-house-heart fs-4" aria-hidden="true"></i>
        <span>InmoPredict</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-nav"
        aria-controls="menu-nav" aria-expanded="false" aria-label="Abrir navegación">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="menu-nav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link ${path === '/index.html' || path === '/' ? 'active fw-semibold' : ''}" 
               href="/index.html">Catálogo</a>
          </li>
          ${autenticado ? `
            <li class="nav-item">
              <a class="nav-link ${path.includes('/predecir.html') ? 'active fw-semibold' : ''}" 
                 href="/predecir.html">Estimar precio</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${path.includes('/publicar.html') ? 'active fw-semibold' : ''}" 
                 href="/publicar.html">Publicar</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${path.includes('/panel.html') ? 'active fw-semibold' : ''}" 
                 href="/panel.html">Mi panel</a>
            </li>
          ` : ''}
        </ul>

        <div class="d-flex align-items-center gap-2 pt-2 pt-lg-0">
          ${autenticado ? `
            <div class="dropdown">
              <button class="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2" 
                type="button" id="menu-user" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle" aria-hidden="true"></i>
                <span id="nav-user-name"></span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="menu-user">
                <li><span class="dropdown-item-text text-muted small" id="nav-user-rol"></span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="/panel.html"><i class="bi bi-grid me-2"></i>Mis Inmuebles</a></li>
                <li>
                  <button class="dropdown-item text-danger" type="button" id="btn-logout">
                    <i class="bi bi-box-arrow-right me-2"></i>Salir
                  </button>
                </li>
              </ul>
            </div>
          ` : `
            <a href="/login.html" class="btn btn-outline-light btn-sm px-3">Ingresar</a>
            <a href="/registro.html" class="btn btn-light btn-sm px-3 fw-semibold">Registrarme</a>
          `}
        </div>
      </div>
    </div>
  `;

  contenedor.replaceWith(nav);

  // Inyección segura con textContent
  if (autenticado && usuario) {
    const elNombre = document.getElementById('nav-user-name');
    const elRol = document.getElementById('nav-user-rol');
    if (elNombre) elNombre.textContent = usuario.nombres || 'Usuario';
    if (elRol) elRol.textContent = `Rol: ${usuario.rol || 'propietario'}`;

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => cerrarSesion());
    }
  }
}
