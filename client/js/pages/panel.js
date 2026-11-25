import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';
import { api } from '../api.js';
import { formatearUSD, formatearPEN, formatearFecha, etiqueta } from '../utils/formato.js';
import { mostrarToast } from '../components/toast.js';
import { ESTADOS_INMUEBLE } from '/shared/contrato.js';

protegerPagina();
renderNavbar();

document.addEventListener('DOMContentLoaded', () => {
  const contInmuebles = document.getElementById('contenedor-mis-inmuebles');
  const contConsultas = document.getElementById('contenedor-mis-consultas');
  const contadorInmuebles = document.getElementById('contador-inmuebles');

  cargarMisInmuebles();
  cargarMisConsultas();

  async function cargarMisInmuebles() {
    contInmuebles.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando…</span>
        </div>
        <p class="text-secondary mt-2 small">Cargando tus inmuebles…</p>
      </div>
    `;

    try {
      const items = await api('/inmuebles/mios');
      contadorInmuebles.textContent = items.length;

      if (!items || items.length === 0) {
        contInmuebles.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-house-add fs-1 text-secondary" aria-hidden="true"></i>
            <h2 class="h5 mt-3">Aún no has publicado ningún inmueble</h2>
            <p class="text-muted small mb-3">Tasa tu propiedad con nuestra inteligencia artificial y ponla a la vista de compradores.</p>
            <a href="/publicar.html" class="btn btn-ip btn-sm">Publicar mi primer inmueble</a>
          </div>
        `;
        return;
      }

      contInmuebles.innerHTML = '<div class="row g-4" id="grid-mis-inmuebles"></div>';
      const grid = document.getElementById('grid-mis-inmuebles');

      items.forEach(inmueble => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';

        const card = document.createElement('article');
        card.className = 'card h-100 ip-card-inmueble border-0 shadow-sm';

        const fotoBox = document.createElement('div');
        fotoBox.className = 'ip-card-foto';
        const img = document.createElement('img');
        img.src = inmueble.foto_principal || '/assets/img/sin-foto.svg';
        img.alt = inmueble.titulo || 'Propiedad';
        img.loading = 'lazy';
        img.onerror = () => { img.src = '/assets/img/sin-foto.svg'; };
        fotoBox.appendChild(img);

        const badgeTipo = document.createElement('span');
        badgeTipo.className = 'badge ip-badge-tipo text-uppercase';
        badgeTipo.textContent = `${etiqueta(inmueble.tipo_inmueble)} · ${etiqueta(inmueble.zona)}`;
        fotoBox.appendChild(badgeTipo);

        card.appendChild(fotoBox);

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
        ubicacion.className = 'ip-ubicacion small mb-3 text-truncate';
        ubicacion.textContent = `📍 ${inmueble.distrito || ''}, ${inmueble.provincia || ''}`;
        body.appendChild(ubicacion);

        const controlEstado = document.createElement('div');
        controlEstado.className = 'mt-auto pt-2 border-top';

        const labelEstado = document.createElement('label');
        labelEstado.className = 'small text-muted fw-semibold mb-1 d-block';
        labelEstado.textContent = 'Estado de publicación:';
        controlEstado.appendChild(labelEstado);

        const selectEstado = document.createElement('select');
        selectEstado.className = 'form-select form-select-sm';
        selectEstado.setAttribute('aria-label', `Cambiar estado de ${inmueble.titulo}`);

        ESTADOS_INMUEBLE.forEach(est => {
          const opt = document.createElement('option');
          opt.value = est;
          opt.textContent = etiqueta(est);
          if (est === inmueble.estado) opt.selected = true;
          selectEstado.appendChild(opt);
        });

        selectEstado.addEventListener('change', async () => {
          const nuevoEstado = selectEstado.value;
          selectEstado.disabled = true;
          try {
            await api(`/inmuebles/${inmueble.id_inmueble}/estado`, {
              metodo: 'PATCH',
              datos: { estado: nuevoEstado },
            });
            inmueble.estado = nuevoEstado;
            mostrarToast(`Estado cambiado a: ${etiqueta(nuevoEstado)}`, 'exito');
          } catch (err) {
            selectEstado.value = inmueble.estado;
            mostrarToast(err.mensaje || 'No se pudo actualizar el estado', 'error');
          } finally {
            selectEstado.disabled = false;
          }
        });

        controlEstado.appendChild(selectEstado);

        const linkDetalle = document.createElement('a');
        linkDetalle.href = `/detalle.html?id=${inmueble.id_inmueble}`;
        linkDetalle.className = 'btn btn-outline-secondary btn-sm w-100 mt-2';
        linkDetalle.innerHTML = '<i class="bi bi-eye me-1" aria-hidden="true"></i> Ver aviso público';
        controlEstado.appendChild(linkDetalle);

        body.appendChild(controlEstado);
        card.appendChild(body);
        col.appendChild(card);
        grid.appendChild(col);
      });

      const colAgregar = document.createElement('div');
      colAgregar.className = 'col-12 col-md-6 col-lg-4';
      colAgregar.innerHTML = `
        <a href="/publicar.html" class="card h-100 border-2 border-dashed text-decoration-none text-secondary d-flex flex-column align-items-center justify-content-center p-5 ip-card-agregar" style="min-height: 280px; border-style: dashed !important;">
          <i class="bi bi-plus-circle fs-1 text-primary mb-2" aria-hidden="true"></i>
          <span class="fw-semibold text-primary">Publicar otro inmueble</span>
          <span class="small text-muted text-center mt-1">Obtén la tasación con IA y publícalo en minutos</span>
        </a>
      `;
      grid.appendChild(colAgregar);

    } catch {
      contInmuebles.innerHTML = `
        <div class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle fs-1" aria-hidden="true"></i>
          <p class="mt-2">No se pudieron cargar tus inmuebles. Intenta recargar la página.</p>
        </div>
      `;
    }
  }

  async function cargarMisConsultas() {
    contConsultas.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando…</span>
        </div>
        <p class="text-secondary mt-2 small">Cargando consultas…</p>
      </div>
    `;

    try {
      const consultas = await api('/predicciones/mias');

      if (!consultas || consultas.length === 0) {
        contConsultas.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-cpu fs-1 text-secondary" aria-hidden="true"></i>
            <h2 class="h5 mt-3">Aún no has realizado ninguna tasación con IA</h2>
            <p class="text-muted small mb-3">Calcula el precio de venta sugerido ingresando los metros cuadrados, zona y características.</p>
            <a href="/predecir.html" class="btn btn-ip btn-sm">Estimar mi primer precio</a>
          </div>
        `;
        return;
      }

      contConsultas.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr class="small text-uppercase">
                <th scope="col">Fecha</th>
                <th scope="col">Superficie</th>
                <th scope="col">Habitaciones</th>
                <th scope="col">Zona</th>
                <th scope="col">Año</th>
                <th scope="col" class="text-end">Precio estimado</th>
              </tr>
            </thead>
            <tbody id="tbody-consultas"></tbody>
          </table>
        </div>
      `;

      const tbody = document.getElementById('tbody-consultas');
      consultas.forEach(c => {
        const tr = document.createElement('tr');

        const tdFecha = document.createElement('td');
        tdFecha.className = 'small text-muted';
        tdFecha.textContent = formatearFecha(c.fecha_prediccion);

        const tdM2 = document.createElement('td');
        tdM2.textContent = `${c.superficie_m2} m²`;

        const tdHab = document.createElement('td');
        tdHab.textContent = `${c.num_habitaciones} hab.`;

        const tdZona = document.createElement('td');
        tdZona.innerHTML = `<span class="badge bg-secondary-subtle text-secondary-emphasis">${etiqueta(c.zona)}</span>`;

        const tdAnio = document.createElement('td');
        tdAnio.textContent = c.anio_construccion || '-';

        const tdPrecio = document.createElement('td');
        tdPrecio.className = 'text-end fw-bold text-primary';
        tdPrecio.textContent = formatearUSD(c.precio_estimado_usd);

        tr.appendChild(tdFecha);
        tr.appendChild(tdM2);
        tr.appendChild(tdHab);
        tr.appendChild(tdZona);
        tr.appendChild(tdAnio);
        tr.appendChild(tdPrecio);
        tbody.appendChild(tr);
      });

    } catch {
      contConsultas.innerHTML = `
        <div class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle fs-1" aria-hidden="true"></i>
          <p class="mt-2">No se pudo obtener el historial de consultas.</p>
        </div>
      `;
    }
  }
});