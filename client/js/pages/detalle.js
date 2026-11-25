import { renderNavbar } from '../components/navbar.js';
import { api } from '../api.js';
import { formatearUSD, formatearPEN, etiqueta } from '../utils/formato.js';

const SIN_FOTO = '/assets/img/sin-foto.svg';

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

  function ponerTexto(id, texto) {
    document.getElementById(id).textContent = texto;
  }

  function mostrarError(mensaje) {
    contenedor.innerHTML = `
      <div class="ip-panel text-center py-5">
        <i class="bi bi-building-x fs-1 text-danger" aria-hidden="true"></i>
        <h2 class="h5 mt-3" id="mensaje-error"></h2>
        <a href="/index.html" class="btn btn-ip mt-3"><i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al catálogo</a>
      </div>
    `;
    ponerTexto('mensaje-error', mensaje);
  }

  function renderizarVista(item, fotos, contacto) {
    if (migasTitulo) migasTitulo.textContent = item.titulo || 'Detalle';
    document.title = `${item.titulo || 'Inmueble'} · InmoPredict`;

    const fotosRutas = fotos.length > 0
      ? fotos.map(f => typeof f === 'string' ? f : f.ruta)
      : [SIN_FOTO];

    contenedor.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="ip-panel p-2">
            <div id="carruselDetalle" class="carousel slide" data-bs-ride="carousel">
              <div class="carousel-indicators" id="carrusel-indicadores"></div>
              <div class="carousel-inner rounded overflow-hidden" id="carrusel-fotos" style="aspect-ratio: 16/10; background: var(--ip-color-borde);"></div>
              <button class="carousel-control-prev" type="button" data-bs-target="#carruselDetalle" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carruselDetalle" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
              </button>
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
              <span class="badge ip-badge-tipo text-uppercase position-static" id="tipo-zona-inmueble"></span>
              <span class="badge bg-success text-uppercase" id="estado-inmueble"></span>
            </div>

            <h1 class="h4 mb-2" id="titulo-inmueble"></h1>
            <p class="text-secondary small mb-3" id="ubicacion-inmueble"></p>

            <div class="mb-3">
              <div class="ip-precio fs-2" id="precio-usd"></div>
              <div class="ip-precio-pen fs-6" id="precio-pen"></div>
            </div>

            <div class="row g-2 text-center my-3">
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Superficie</div>
                  <strong class="fs-6" id="superficie-inmueble"></strong>
                </div>
              </div>
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Habitaciones</div>
                  <strong class="fs-6" id="habitaciones-inmueble"></strong>
                </div>
              </div>
              <div class="col-4">
                <div class="border rounded p-2 bg-light">
                  <div class="small text-muted">Construcción</div>
                  <strong class="fs-6" id="anio-inmueble"></strong>
                </div>
              </div>
            </div>

            <div class="alert alert-light border small mt-3 p-3" id="comparativa-ia" hidden>
              <div class="fw-semibold text-primary mb-1"><i class="bi bi-cpu" aria-hidden="true"></i> Estimación de IA InmoPredict</div>
              <div>Precio estimado: <strong id="precio-estimado"></strong> (<span id="mensaje-comparativa"></span>).</div>
            </div>

            <div class="border-top pt-3 mt-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-person-circle fs-3 text-secondary" aria-hidden="true"></i>
                <div>
                  <div class="small text-muted">Contacto:</div>
                  <strong id="contacto-nombre"></strong>
                </div>
              </div>
              <a id="boton-whatsapp" target="_blank" rel="noopener noreferrer" class="btn btn-ip w-100 py-2" hidden>
                <i class="bi bi-whatsapp me-1" aria-hidden="true"></i> Contactar al propietario
              </a>
              <button class="btn btn-secondary w-100 py-2" id="boton-sin-telefono" disabled hidden>Teléfono no disponible</button>
            </div>
          </div>
        </div>
      </div>
    `;

    llenarCarrusel(fotosRutas);

    ponerTexto('tipo-zona-inmueble', `${etiqueta(item.tipo_inmueble || 'Inmueble')} · ${etiqueta(item.zona || '')}`);
    ponerTexto('estado-inmueble', etiqueta(item.estado || 'publicado'));
    ponerTexto('titulo-inmueble', item.titulo || 'Sin título');
    ponerTexto('desc-inmueble', item.descripcion || 'Sin descripción disponible.');
    ponerTexto('ubicacion-inmueble', `📍 ${item.distrito || ''}, ${item.provincia || ''} (${item.region || 'Perú'})`);
    ponerTexto('precio-usd', formatearUSD(item.precio_venta_usd));
    ponerTexto('precio-pen', formatearPEN(item.precio_venta_usd));
    ponerTexto('superficie-inmueble', `${item.superficie_m2 || 0} m²`);
    ponerTexto('habitaciones-inmueble', item.num_habitaciones || 0);
    ponerTexto('anio-inmueble', item.anio_construccion || '-');
    ponerTexto('contacto-nombre', contacto.nombres || 'Propietario');

    if (item.precio_estimado_usd) mostrarComparativa(item);
    mostrarContacto(item, contacto);
  }

  function llenarCarrusel(rutas) {
    const indicadores = document.getElementById('carrusel-indicadores');
    const contFotos = document.getElementById('carrusel-fotos');

    rutas.forEach((ruta, i) => {
      const diapositiva = document.createElement('div');
      diapositiva.className = `carousel-item ${i === 0 ? 'active' : ''} h-100`;
      const img = document.createElement('img');
      img.className = 'd-block w-100 h-100 object-fit-cover';
      img.alt = 'Fotografía del inmueble';
      img.addEventListener('error', () => { img.src = SIN_FOTO; }, { once: true });
      img.src = ruta;
      diapositiva.appendChild(img);
      contFotos.appendChild(diapositiva);
    });

    if (rutas.length === 1) {
      document.querySelectorAll('#carruselDetalle button').forEach(boton => boton.remove());
      indicadores.remove();
      return;
    }

    rutas.forEach((_, i) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.dataset.bsTarget = '#carruselDetalle';
      boton.dataset.bsSlideTo = i;
      if (i === 0) boton.className = 'active';
      boton.setAttribute('aria-label', `Foto ${i + 1}`);
      indicadores.appendChild(boton);
    });
  }

  function mostrarComparativa(item) {
    const pedido = Number(item.precio_venta_usd);
    const estimado = Number(item.precio_estimado_usd);
    const dif = Math.round(((pedido - estimado) / estimado) * 100);
    const mensajeComp = dif > 0
      ? `el precio pedido está ${dif}% por encima de la tasación`
      : (dif < 0 ? `el precio pedido está ${Math.abs(dif)}% por debajo de la tasación` : 'precio alineado con la tasación');

    ponerTexto('precio-estimado', formatearUSD(estimado));
    ponerTexto('mensaje-comparativa', mensajeComp);
    document.getElementById('comparativa-ia').hidden = false;
  }

  function mostrarContacto(item, contacto) {
    const telLimpio = (contacto.telefono || '').replace(/\D/g, '');
    if (!telLimpio) {
      document.getElementById('boton-sin-telefono').hidden = false;
      return;
    }
    const enlace = document.getElementById('boton-whatsapp');
    enlace.href = `https://wa.me/51${telLimpio}?text=Hola,%20estoy%20interesado%20en%20el%20inmueble:%20${encodeURIComponent(item.titulo || '')}`;
    enlace.hidden = false;
  }
});
