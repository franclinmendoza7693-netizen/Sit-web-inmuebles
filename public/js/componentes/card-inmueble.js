/**
 * InmoPredict — Card de Inmueble con protección anti-XSS (.textContent)
 * Dueño: Dev C (Frontend y UX)
 */
import { formatearUSD, formatearPEN, etiqueta } from '../utils/formato.js';

export function crearCardInmueble(inmueble) {
  const card = document.createElement('article');
  card.className = 'card h-100 ip-card-inmueble border-0';

  const boxFoto = document.createElement('div');
  boxFoto.className = 'ip-card-foto';

  const img = document.createElement('img');
  img.src = inmueble.foto_principal || '/img/sin-foto.svg';
  img.alt = inmueble.titulo || 'Propiedad';
  img.loading = 'lazy';
  img.onerror = () => { img.src = '/img/sin-foto.svg'; };
  boxFoto.appendChild(img);

  const badge = document.createElement('span');
  badge.className = 'badge ip-badge-tipo text-uppercase';
  const tipoTxt = etiqueta(inmueble.tipo_inmueble || 'Inmueble');
  const zonaTxt = etiqueta(inmueble.zona || '');
  badge.textContent = zonaTxt ? `${tipoTxt} · ${zonaTxt}` : tipoTxt;
  boxFoto.appendChild(badge);

  card.appendChild(boxFoto);

  const body = document.createElement('div');
  body.className = 'card-body p-3 d-flex flex-column';

  const precioUsd = document.createElement('div');
  precioUsd.className = 'ip-precio';
  precioUsd.textContent = formatearUSD(inmueble.precio_venta_usd);
  body.appendChild(precioUsd);

  const precioPen = document.createElement('div');
  precioPen.className = 'ip-precio-pen small mb-2';
  precioPen.textContent = formatearPEN(inmueble.precio_venta_usd);
  body.appendChild(precioPen);

  const titulo = document.createElement('h2');
  titulo.className = 'h6 card-title text-truncate mb-1';
  titulo.textContent = inmueble.titulo || 'Sin título';
  body.appendChild(titulo);

  const ubicacion = document.createElement('p');
  ubicacion.className = 'ip-ubicacion small mb-2 text-truncate';
  const dist = inmueble.distrito || '';
  const prov = inmueble.provincia || '';
  ubicacion.textContent = dist && prov ? `📍 ${dist}, ${prov}` : (dist ? `📍 ${dist}` : '📍 Sin ubicación');
  body.appendChild(ubicacion);

  const datos = document.createElement('div');
  datos.className = 'ip-datos small mt-auto pt-2 border-top d-flex justify-content-between';
  
  const m2 = document.createElement('span');
  m2.textContent = `${inmueble.superficie_m2 || 0} m²`;
  
  const hab = document.createElement('span');
  hab.textContent = `${inmueble.num_habitaciones || 0} hab.`;

  datos.appendChild(m2);
  datos.appendChild(hab);
  body.appendChild(datos);

  const link = document.createElement('a');
  link.href = `/detalle.html?id=${inmueble.id_inmueble}`;
  link.className = 'stretched-link';
  link.setAttribute('aria-label', `Ver detalles de ${inmueble.titulo || 'propiedad'}`);
  body.appendChild(link);

  card.appendChild(body);
  return card;
}
