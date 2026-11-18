/**
 * InmoPredict — Catálogo y Filtros Reactivos
 */
import '../components/navbar.js';
import { api } from '../api.js';
import { crearCardInmueble } from '../components/card-inmueble.js';

let timerDebounce = null;

document.addEventListener('DOMContentLoaded', () => {
  const formFiltros = document.getElementById('form-filtros');
  const contenedor = document.getElementById('lista-inmuebles');
  const estadoTxt = document.getElementById('estado-catalogo');

  cargarCatalogo();

  if (formFiltros) {
    formFiltros.addEventListener('submit', (e) => {
      e.preventDefault();
      cargarCatalogo();
    });

    const inputDistrito = document.getElementById('f-distrito');
    if (inputDistrito) {
      inputDistrito.addEventListener('input', () => {
        clearTimeout(timerDebounce);
        timerDebounce = setTimeout(cargarCatalogo, 350);
      });
    }

    ['f-tipo', 'f-zona'].forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.addEventListener('change', cargarCatalogo);
      }
    });
  }

  async function cargarCatalogo() {
    const params = new URLSearchParams();

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
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-secondary mt-2 small">Cargando catálogo…</p>
      </div>
    `;

    try {
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

      contenedor.innerHTML = '';
      if (items.length === 0) {
        estadoTxt.textContent = '0 inmuebles encontrados';
        contenedor.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-search fs-1 text-secondary" aria-hidden="true"></i>
            <h2 class="h5 mt-3 text-secondary">No se encontraron resultados</h2>
            <p class="text-muted small">Prueba cambiando los filtros de búsqueda.</p>
          </div>
        `;
        return;
      }

      estadoTxt.textContent = `${total} inmueble${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`;

      items.forEach(inmueble => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-3';
        col.appendChild(crearCardInmueble(inmueble));
        contenedor.appendChild(col);
      });

    } catch {
      estadoTxt.textContent = 'Error al cargar propiedades.';
      contenedor.innerHTML = `
        <div class="col-12 text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle fs-1"></i>
          <p class="mt-2">No se pudieron cargar los datos.</p>
        </div>
      `;
    }
  }
});
