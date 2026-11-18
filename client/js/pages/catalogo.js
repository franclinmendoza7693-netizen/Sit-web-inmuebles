<<<<<<< HEAD
=======
/**
 * InmoPredict — Catálogo y Filtros Reactivos
 */
>>>>>>> developer
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api.js';
import { crearCardInmueble } from '../components/card-inmueble.js';

renderNavbar();

<<<<<<< HEAD
let debounceTimer = null;
let paginaActual = 1;
const POR_PAGINA = 8;
let ordenActual = 'recientes';
=======
let timerDebounce = null;
>>>>>>> developer

document.addEventListener('DOMContentLoaded', () => {
  const formFiltros = document.getElementById('form-filtros');
  const contenedor = document.getElementById('lista-inmuebles');
  const estadoTxt = document.getElementById('estado-catalogo');
<<<<<<< HEAD
  const selectOrden = document.getElementById('f-orden');

  cargarInmuebles();

  if (selectOrden) {
    selectOrden.addEventListener('change', () => {
      ordenActual = selectOrden.value;
      paginaActual = 1;
      cargarInmuebles();
    });
  }
=======

  cargarCatalogo();
>>>>>>> developer

  if (formFiltros) {
    formFiltros.addEventListener('submit', (e) => {
      e.preventDefault();
<<<<<<< HEAD
      paginaActual = 1;
      cargarInmuebles();
=======
      cargarCatalogo();
>>>>>>> developer
    });

    const inputDistrito = document.getElementById('f-distrito');
    if (inputDistrito) {
      inputDistrito.addEventListener('input', () => {
<<<<<<< HEAD
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          paginaActual = 1;
          cargarInmuebles();
        }, 350);
=======
        clearTimeout(timerDebounce);
        timerDebounce = setTimeout(cargarCatalogo, 350);
>>>>>>> developer
      });
    }

    ['f-tipo', 'f-zona'].forEach(id => {
      const select = document.getElementById(id);
      if (select) {
<<<<<<< HEAD
        select.addEventListener('change', () => {
          paginaActual = 1;
          cargarInmuebles();
        });
=======
        select.addEventListener('change', cargarCatalogo);
>>>>>>> developer
      }
    });
  }

<<<<<<< HEAD
  async function cargarInmuebles() {
    const params = new URLSearchParams();
    params.set('pagina', paginaActual);
    params.set('por_pagina', POR_PAGINA);
    params.set('orden', ordenActual);
=======
  async function cargarCatalogo() {
    const params = new URLSearchParams();
>>>>>>> developer

    if (formFiltros) {
      const data = new FormData(formFiltros);
      for (const [k, v] of data.entries()) {
        const val = v.trim();
        if (val !== '') params.set(k, val);
      }
    }

    estadoTxt.textContent = 'Buscando inmuebles…';
    contenedor.innerHTML = `
      <div class="col-12 text-center py-5">
<<<<<<< HEAD
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando…</span>
        </div>
=======
        <div class="spinner-border text-primary" role="status"></div>
>>>>>>> developer
        <p class="text-secondary mt-2 small">Cargando catálogo…</p>
      </div>
    `;

    try {
<<<<<<< HEAD
      const res = await api(`/inmuebles?${params.toString()}`);
      const items = res.items || [];
      const total = res.total ?? items.length;
=======
      let items = [];
      let total = 0;

      try {
        const res = await api(`/inmuebles?${params.toString()}`);
        items = res.items || [];
        total = res.total ?? items.length;
      } catch (errApi) {
        // Fallback a mocks/inmuebles.json si el backend no tiene el endpoint listo
        const rMock = await fetch('/mocks/inmuebles.json');
        const mockData = await rMock.json();

        items = mockData.filter(item => {
          if (params.get('tipo_inmueble') && item.tipo_inmueble !== params.get('tipo_inmueble')) return false;
          if (params.get('zona') && item.zona !== params.get('zona')) return false;
          if (params.get('distrito')) {
            const query = params.get('distrito').toLowerCase();
            const dist = (item.distrito || '').toLowerCase();
            const prov = (item.provincia || '').toLowerCase();
            if (!dist.includes(query) && !prov.includes(query)) return false;
          }
          if (params.get('precio_min') && Number(item.precio_venta_usd) < Number(params.get('precio_min'))) return false;
          if (params.get('precio_max') && Number(item.precio_venta_usd) > Number(params.get('precio_max'))) return false;
          return true;
        });
        total = items.length;
      }
>>>>>>> developer

      contenedor.innerHTML = '';
      if (items.length === 0) {
        estadoTxt.textContent = '0 inmuebles encontrados';
        contenedor.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-search fs-1 text-secondary" aria-hidden="true"></i>
<<<<<<< HEAD
            <h2 class="h5 mt-3 text-secondary">No se encontraron inmuebles</h2>
            <p class="text-muted small">Prueba modificando los filtros de búsqueda.</p>
          </div>
        `;
        renderizarPaginacion(0);
=======
            <h2 class="h5 mt-3 text-secondary">No se encontraron resultados</h2>
            <p class="text-muted small">Prueba cambiando los filtros de búsqueda.</p>
          </div>
        `;
>>>>>>> developer
        return;
      }

      estadoTxt.textContent = `${total} inmueble${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`;

      items.forEach(inmueble => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-3';
        col.appendChild(crearCardInmueble(inmueble));
        contenedor.appendChild(col);
      });

<<<<<<< HEAD
      renderizarPaginacion(total);
=======
>>>>>>> developer
    } catch {
      estadoTxt.textContent = 'Error al cargar propiedades.';
      contenedor.innerHTML = `
        <div class="col-12 text-center py-5 text-danger">
<<<<<<< HEAD
          <i class="bi bi-exclamation-triangle fs-1" aria-hidden="true"></i>
          <p class="mt-2">No se pudieron cargar los datos del catálogo.</p>
=======
          <i class="bi bi-exclamation-triangle fs-1"></i>
          <p class="mt-2">No se pudieron cargar los datos.</p>
>>>>>>> developer
        </div>
      `;
    }
  }
<<<<<<< HEAD

  function renderizarPaginacion(total) {
    const navPaginacion = document.getElementById('nav-paginacion');
    const listaPaginacion = document.getElementById('lista-paginacion');
    if (!navPaginacion || !listaPaginacion) return;

    const totalPaginas = Math.ceil(total / POR_PAGINA);
    if (totalPaginas <= 1) {
      navPaginacion.hidden = true;
      listaPaginacion.innerHTML = '';
      return;
    }

    navPaginacion.hidden = false;
    listaPaginacion.innerHTML = '';

    const liPrev = document.createElement('li');
    liPrev.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liPrev.innerHTML = `<button class="page-link" aria-label="Página anterior">‹ Anterior</button>`;
    if (paginaActual > 1) {
      liPrev.querySelector('button').addEventListener('click', () => {
        paginaActual--;
        cargarInmuebles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    listaPaginacion.appendChild(liPrev);

    for (let i = 1; i <= totalPaginas; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
      li.innerHTML = `<button class="page-link">${i}</button>`;
      li.querySelector('button').addEventListener('click', () => {
        if (paginaActual !== i) {
          paginaActual = i;
          cargarInmuebles();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      listaPaginacion.appendChild(li);
    }

    const liNext = document.createElement('li');
    liNext.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liNext.innerHTML = `<button class="page-link" aria-label="Página siguiente">Siguiente ›</button>`;
    if (paginaActual < totalPaginas) {
      liNext.querySelector('button').addEventListener('click', () => {
        paginaActual++;
        cargarInmuebles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    listaPaginacion.appendChild(liNext);
  }
});
=======
});
>>>>>>> developer
