// Página de estimación de precio (predecir.html)
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api.js';
import { STORAGE, LIMITES, ZONAS, ETIQUETAS } from '/shared/contrato.js';
import { predecirPrecio } from '../ml/prediccion.js';
import { formatearUSD, formatearPEN, etiqueta } from '../utils/formato.js';
import { pintarErrores, limpiarErrores } from '../utils/formulario.js';

renderNavbar();

const form = document.getElementById('form-prediccion');
const btnPredecir = document.getElementById('btn-predecir');
const contResultado = document.getElementById('resultado-prediccion');
const txtPrecioUSD = document.getElementById('resultado-precio-usd');
const txtPrecioPEN = document.getElementById('resultado-precio-pen');
const txtRango = document.getElementById('resultado-rango');
const avisoFueraRango = document.getElementById('aviso-fuera-rango');
const btnIrPublicar = document.getElementById('btn-ir-publicar');
const contHistorial = document.getElementById('historial-predicciones');

const PUNTOS_SUPERFICIE = [40, 80, 120, 160, 200, 250, 300, 350, 400];

let ultimaPrediccion = null;

cargarHistorial();

form?.addEventListener('submit', manejarEstimacion);

btnIrPublicar?.addEventListener('click', () => {
  if (!ultimaPrediccion) return;
  sessionStorage.setItem(STORAGE.PREDICCION_PENDIENTE, JSON.stringify(ultimaPrediccion));
  window.location.href = '/publicar.html';
});

function validarEntrada(datos) {
  const errores = {};
  for (const campo of ['superficie_m2', 'num_habitaciones', 'anio_construccion']) {
    const { min, max } = LIMITES[campo];
    if (!Number.isFinite(datos[campo]) || datos[campo] < min || datos[campo] > max) {
      errores[campo] = `Debe estar entre ${min} y ${max}.`;
    }
  }
  if (!ZONAS.includes(datos.zona)) {
    errores.zona = 'Selecciona una zona válida.';
  }
  return errores;
}

async function manejarEstimacion(e) {
  e.preventDefault();
  if (!form) return;

  limpiarErrores(form);

  const datos = {
    superficie_m2: Number(form.elements.superficie_m2?.value),
    num_habitaciones: Number(form.elements.num_habitaciones?.value),
    zona: String(form.elements.zona?.value || '').trim().toLowerCase(),
    anio_construccion: Number(form.elements.anio_construccion?.value),
  };

  const errores = validarEntrada(datos);
  if (Object.keys(errores).length > 0) {
    pintarErrores(form, errores);
    return;
  }

  btnPredecir.disabled = true;
  const nodosOriginales = Array.from(btnPredecir.childNodes).map((n) => n.cloneNode(true));
  btnPredecir.textContent = 'Calculando…';

  try {
    const res = await predecirPrecio(datos);

    txtPrecioUSD.textContent = formatearUSD(res.precio_estimado_usd);
    txtPrecioPEN.textContent = formatearPEN(res.precio_estimado_usd);
    txtRango.textContent = `Rango estimado: ${formatearUSD(res.rango_min_usd)} — ${formatearUSD(res.rango_max_usd)}`;

    if (avisoFueraRango) {
      avisoFueraRango.hidden = !res.fuera_de_rango;
    }

    contResultado.hidden = false;

    ultimaPrediccion = {
      ...datos,
      precio_estimado_usd: res.precio_estimado_usd,
      version_modelo: res.version_modelo,
    };

    await renderizarGraficoSensibilidad(datos, res.precio_estimado_usd);
    guardarEnApi(ultimaPrediccion);
  } catch (err) {
    pintarErrores(form, { superficie_m2: err.message || 'No se pudo calcular el precio.' });
  } finally {
    btnPredecir.disabled = false;
    btnPredecir.replaceChildren(...nodosOriginales);
  }
}

// Extra 10.3: curva de sensibilidad (precio estimado según superficie para la zona elegida)
async function renderizarGraficoSensibilidad(datosBase, precioUsuario) {
  let caja = document.getElementById('grafico-sensibilidad');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'grafico-sensibilidad';
    caja.className = 'mt-4 pt-3 border-top';
    contResultado.append(caja);
  }
  caja.replaceChildren();

  const titulo = document.createElement('p');
  titulo.className = 'small fw-semibold text-secondary mb-2';
  titulo.textContent = `Curva de sensibilidad · Zona ${ETIQUETAS[datosBase.zona] ?? datosBase.zona} (${datosBase.num_habitaciones} hab., año ${datosBase.anio_construccion})`;
  caja.append(titulo);

  const puntos = await Promise.all(
    PUNTOS_SUPERFICIE.map(async (m2) => {
      const r = await predecirPrecio({ ...datosBase, superficie_m2: m2 });
      return { x: m2, y: r.precio_estimado_usd };
    }),
  );

  const ancho = 460;
  const alto = 170;
  const pad = { top: 16, right: 20, bottom: 28, left: 68 };
  const w = ancho - pad.left - pad.right;
  const h = alto - pad.top - pad.bottom;

  const minX = 40;
  const maxX = 400;
  const minY = Math.min(...puntos.map((p) => p.y), precioUsuario) * 0.9;
  const maxY = Math.max(...puntos.map((p) => p.y), precioUsuario) * 1.05;

  const escX = (x) => pad.left + ((Math.min(Math.max(x, minX), maxX) - minX) / (maxX - minX)) * w;
  const escY = (y) => pad.top + h - ((y - minY) / (maxY - minY || 1)) * h;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('class', 'w-100');
  svg.style.maxHeight = '190px';

  // Ejes guía
  for (const frac of [0, 0.5, 1]) {
    const yVal = minY + (maxY - minY) * frac;
    const yPos = escY(yVal);
    const linea = document.createElementNS(svgNS, 'line');
    linea.setAttribute('x1', pad.left);
    linea.setAttribute('x2', ancho - pad.right);
    linea.setAttribute('y1', yPos);
    linea.setAttribute('y2', yPos);
    linea.setAttribute('stroke', '#e2e8f0');
    linea.setAttribute('stroke-dasharray', '3 3');
    svg.append(linea);

    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', pad.left - 6);
    lbl.setAttribute('y', yPos + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('font-size', '10');
    lbl.setAttribute('fill', '#64748b');
    lbl.textContent = formatearUSD(Math.round(yVal));
    svg.append(lbl);
  }

  for (const m2 of [40, 120, 200, 300, 400]) {
    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', escX(m2));
    lbl.setAttribute('y', alto - 6);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-size', '10');
    lbl.setAttribute('fill', '#64748b');
    lbl.textContent = `${m2} m²`;
    svg.append(lbl);
  }

  // Línea de tendencia de la red neuronal
  const dPath = puntos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${escX(p.x).toFixed(1)} ${escY(p.y).toFixed(1)}`)
    .join(' ');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', dPath);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#1d3557');
  path.setAttribute('stroke-width', '2.5');
  svg.append(path);

  // Punto del inmueble del usuario (si cae dentro de 40–400 m²)
  if (datosBase.superficie_m2 >= minX && datosBase.superficie_m2 <= maxX) {
    const cx = escX(datosBase.superficie_m2);
    const cy = escY(precioUsuario);
    const circ = document.createElementNS(svgNS, 'circle');
    circ.setAttribute('cx', cx);
    circ.setAttribute('cy', cy);
    circ.setAttribute('r', '5.5');
    circ.setAttribute('fill', '#c8553d');
    circ.setAttribute('stroke', '#ffffff');
    circ.setAttribute('stroke-width', '2');
    svg.append(circ);
  }

  caja.append(svg);

  const nota = document.createElement('p');
  nota.className = 'small text-secondary mb-0 mt-1';
  nota.textContent =
    datosBase.superficie_m2 >= minX && datosBase.superficie_m2 <= maxX
      ? `Punto rojo: tu inmueble (${datosBase.superficie_m2} m² → ${formatearUSD(precioUsuario)}).`
      : `Tu inmueble (${datosBase.superficie_m2} m²) supera el rango típico del gráfico (40–400 m²).`;
  caja.append(nota);
}

async function guardarEnApi(prediccion) {
  if (!localStorage.getItem(STORAGE.TOKEN)) return;
  try {
    await api('/predicciones', { metodo: 'POST', datos: prediccion });
    await cargarHistorial();
  } catch {
    // Si falla el guardado remoto no interrumpe la predicción local
  }
}

async function cargarHistorial() {
  if (!contHistorial) return;

  if (!localStorage.getItem(STORAGE.TOKEN)) {
    contHistorial.textContent = 'Inicia sesión para guardar y ver tu historial de consultas.';
    return;
  }

  try {
    const data = await api('/predicciones/mias');
    const items = Array.isArray(data) ? data : data?.items || [];

    contHistorial.replaceChildren();
    if (items.length === 0) {
      contHistorial.textContent = 'Aún no hay consultas.';
      return;
    }

    const lista = document.createElement('div');
    lista.className = 'list-group';

    for (const p of items.slice(0, 5)) {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';

      const info = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.className = 'd-block';
      titulo.textContent = `${p.superficie_m2} m² · ${p.num_habitaciones} hab. · ${etiqueta(p.zona)}`;

      const sub = document.createElement('small');
      sub.className = 'text-secondary';
      sub.textContent = `Año ${p.anio_construccion}`;

      info.append(titulo, sub);

      const precio = document.createElement('span');
      precio.className = 'badge bg-primary rounded-pill fs-6';
      precio.textContent = formatearUSD(p.precio_estimado_usd);

      item.append(info, precio);
      lista.append(item);
    }

    contHistorial.append(lista);
  } catch {
    contHistorial.textContent = 'No se pudo cargar el historial.';
  }
}