// Tarjeta de inmueble para el catálogo y el panel — dueño: Dev C
// Recibe un elemento de items[] de GET /api/inmuebles (sección 5 del plan).
import { formatearUSD, formatearPEN, formatearM2, etiqueta } from '../utils/formato.js';

export function crearCardInmueble(inmueble) {
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
  col.innerHTML = `
    <a class="card h-100 ip-card-inmueble text-decoration-none" href="/detalle.html?id=${Number(inmueble.id_inmueble)}">
      <div class="ip-card-foto">
        <img class="card-img-top" alt="" loading="lazy">
        <span class="badge ip-badge-tipo"></span>
      </div>
      <div class="card-body">
        <p class="ip-precio mb-0"></p>
        <p class="ip-precio-pen small mb-2"></p>
        <h3 class="h6 card-title ip-titulo"></h3>
        <p class="small ip-ubicacion mb-2"><i class="bi bi-geo-alt"></i> <span></span></p>
        <div class="d-flex gap-3 small ip-datos">
          <span><i class="bi bi-rulers"></i> <span class="ip-m2"></span></span>
          <span><i class="bi bi-door-closed"></i> <span class="ip-hab"></span></span>
        </div>
      </div>
    </a>`;

  // textContent para todo lo que escribe el usuario (evita inyección de HTML)
  const img = col.querySelector('img');
  img.src = inmueble.foto_principal || '/img/sin-foto.svg';
  img.onerror = () => { img.src = '/img/sin-foto.svg'; };
  col.querySelector('.ip-badge-tipo').textContent = `${etiqueta(inmueble.tipo_inmueble)} · ${etiqueta(inmueble.zona)}`;
  col.querySelector('.ip-precio').textContent = formatearUSD(inmueble.precio_venta_usd);
  col.querySelector('.ip-precio-pen').textContent = formatearPEN(inmueble.precio_venta_usd);
  col.querySelector('.ip-titulo').textContent = inmueble.titulo;
  col.querySelector('.ip-ubicacion span').textContent = `${inmueble.distrito}, ${inmueble.provincia}`;
  col.querySelector('.ip-m2').textContent = formatearM2(inmueble.superficie_m2);
  col.querySelector('.ip-hab').textContent = `${inmueble.num_habitaciones} hab.`;
  return col;
}
