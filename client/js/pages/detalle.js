<<<<<<< HEAD
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api.js';
import { formatearUSD, formatearPEN, etiqueta } from '../utils/formato.js';

renderNavbar();

document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('detalle-inmueble');
  const migasTitulo = document.getElementById('migas-titulo');

  const params = new URLSearchParams(window.location.search);
  const idInmueble = params.get('id');

  if (!idInmueble) {
    mostrarError('No se indicó el identificador del inmueble.');
    return;
  }

  try {
    const data = await api(`/inmuebles/${idInmueble}`);
    const inmueble = data.inmueble || data;
    const fotos = Array.isArray(data.fotos) && data.fotos.length > 0 
      ? data.fotos 
      : (inmueble.foto_principal ? [{ ruta: inmueble.foto_principal }] : []);
    const contacto = data.contacto || { nombres: 'Propietario', telefono: null };

    renderizarVista(inmueble, fotos, contacto);
  } catch (err) {
    mostrarError(err.mensaje || 'El inmueble solicitado no existe o no se pudo cargar.');
  }

  function mostrarError(mensaje) {
    contenedor.innerHTML = `
      <div class="ip-panel text-center py-5">
        <i class="bi bi-building-x fs-1 text-danger" aria-hidden="true"></i>
        <h2 class="h5 mt-3">${mensaje}</h2>
        <a href="/index.html" class="btn btn-ip mt-3"><i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al catálogo</a>
      </div>
    `;
  }

  function renderizarVista(item, fotos, contacto) {
    if (migasTitulo) migasTitulo.textContent = item.titulo || 'Detalle';
    document.title = `${item.titulo || 'Inmueble'} · InmoPredict`;

    const fotosRutas = fotos.length > 0 
      ? fotos.map(f => typeof f === 'string' ? f : f.ruta)
      : ['/assets/img/sin-foto.svg'];

    let comparativaHtml = '';
    if (item.precio_estimado_usd) {
      const pedido = Number(item.precio_venta_usd);
      const estimado = Number(item.precio_estimado_usd);
      const dif = Math.round(((pedido - estimado) / estimado) * 100);
      const mensajeComp = dif > 0 
        ? `el precio pedido está ${dif}% por encima de la tasación`
        : (dif < 0 ? `el precio pedido está ${Math.abs(dif)}% por debajo de la tasación` : 'precio alineado con la tasación');

      comparativaHtml = `
        <div class="alert alert-light border small mt-3 p-3">
          <div class="fw-semibold text-primary mb-1"><i class="bi bi-cpu" aria-hidden="true"></i> Estimación de IA InmoPredict</div>
          <div>Precio estimado: <strong>${formatearUSD(estimado)}</strong> (${mensajeComp}).</div>
        </div>
      `;
    }

    const telLimpio = (contacto.telefono || '').replace(/\D/g, '');
    const botonContactoHtml = telLimpio
      ? `<a href="https://wa.me/51${telLimpio}?text=Hola,%20estoy%20interesado%20en%20el%20inmueble:%20${encodeURIComponent(item.titulo || '')}" 
            target="_blank" rel="noopener noreferrer" class="btn btn-ip w-100 py-2">
           <i class="bi bi-whatsapp me-1" aria-hidden="true"></i> Contactar al propietario
         </a>`
      : `<button class="btn btn-secondary w-100 py-2" disabled>Teléfono no disponible</button>`;

    contenedor.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="ip-panel p-2">
            <div id="carruselDetalle" class="carousel slide" data-bs-ride="carousel">
              ${fotosRutas.length > 1 ? `
                <div class="carousel-indicators">
                  ${fotosRutas.map((_, i) => `
                    <button type="button" data-bs-target="#carruselDetalle" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}" aria-label="Foto ${i + 1}"></button>
                  `).join('')}
                </div>
              ` : ''}
              <div class="carousel-inner rounded overflow-hidden" style="aspect-ratio: 16/10; background: var(--ip-color-borde);">
                ${fotosRutas.map((src, i) => `
                  <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                    <img src="${src}" class="d-block w-100 h-100 object-fit-cover" alt="Fotografía del inmueble" onerror="this.src='/assets/img/sin-foto.svg'">
                  </div>
                `).join('')}
              </div>
              ${fotosRutas.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#carruselDetalle" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Anterior</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carruselDetalle" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Siguiente</span>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="ip-panel mt-4">
            <h2 class="h5 mb-3">Descripción</h2>
            <p id="desc-inmueble" class="text-secondary mb-0" style="white-space: pre-line;"></p>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="ip-panel">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge ip-badge-tipo text-uppercase position-static">
                ${etiqueta(item.tipo_inmueble || 'Inmueble')} · ${etiqueta(item.zona || '')}
              </span>
              <span class="badge bg-success text-uppercase">${etiqueta(item.estado || 'publicado')}</span>
            </div>

            <h1 class="h4 mb-2" id="titulo-inmueble"></h1>
            <p class="text-secondary small mb-3" id="ubicacion-inmueble"></p>

            <div class="mb-3">
              <div class="ip-precio fs-2">${formatearUSD(item.precio_venta_usd)}</div>
              <div class="ip-precio-pen fs-6">${formatearPEN(item.precio_venta_usd)}</div>
            </div>

            <div class="row g-2 text-center my-3">
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Superficie</div>
                  <strong class="fs-6">${item.superficie_m2 || 0} m²</strong>
                </div>
              </div>
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Habitaciones</div>
                  <strong class="fs-6">${item.num_habitaciones || 0}</strong>
                </div>
              </div>
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Construcción</div>
                  <strong class="fs-6">${item.anio_construccion || '-'}</strong>
                </div>
              </div>
            </div>

            ${comparativaHtml}

            <div class="border-top pt-3 mt-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-person-circle fs-3 text-secondary" aria-hidden="true"></i>
                <div>
                  <div class="small text-muted">Contacto:</div>
                  <strong id="contacto-nombre"></strong>
                </div>
              </div>
              ${botonContactoHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('titulo-inmueble').textContent = item.titulo || 'Sin título';
    document.getElementById('desc-inmueble').textContent = item.descripcion || 'Sin descripción disponible.';
    document.getElementById('ubicacion-inmueble').textContent = `📍 ${item.distrito || ''}, ${item.provincia || ''} (${item.region || 'Perú'})`;
    document.getElementById('contacto-nombre').textContent = contacto.nombres || 'Propietario';
  }
});
=======
// Detalle de un inmueble (detalle.html?id=12)
import { renderNavbar } from '../components/navbar.js';

renderNavbar();

// TODO: leer el id de la URL, pedir el inmueble a GET /api/inmuebles/:id_inmueble (incluye
// fotos y contacto) y mostrar galería (carousel de Bootstrap), precio en USD y S/, datos,
// descripción y botón de contacto. Si la API responde NO_ENCONTRADO, mostrar un mensaje
// amable con enlace al catálogo.
>>>>>>> developer
