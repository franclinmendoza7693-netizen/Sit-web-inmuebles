// Catálogo público (index.html) — dueño: Dev C
// Día 1: lee public/mocks/inmuebles.json (misma forma que la API).
// Día 3: cambiar USAR_MOCK a false para leer GET /api/inmuebles con filtros y paginación.
import { renderNavbar } from '../componentes/navbar.js';
import { crearCardInmueble } from '../componentes/card-inmueble.js';
import { api } from '../api.js';

const USAR_MOCK = true;

renderNavbar();

const lista = document.getElementById('lista-inmuebles');
const estado = document.getElementById('estado-catalogo');
const formFiltros = document.getElementById('form-filtros');

async function cargar() {
  estado.textContent = 'Cargando inmuebles…';
  lista.replaceChildren();
  try {
    let items;
    if (USAR_MOCK) {
      items = await (await fetch('/mocks/inmuebles.json')).json();
    } else {
      const parametros = new URLSearchParams(new FormData(formFiltros));
      for (const [clave, valor] of [...parametros]) if (!valor) parametros.delete(clave);
      ({ items } = await api(`/inmuebles?${parametros}`));
    }
    estado.textContent = items.length ? `${items.length} inmuebles` : 'No hay inmuebles con esos filtros';
    items.forEach((inmueble) => lista.append(crearCardInmueble(inmueble)));
  } catch (error) {
    estado.textContent = error.message;
  }
}

formFiltros.addEventListener('submit', (e) => {
  e.preventDefault();
  cargar();
});

cargar();
