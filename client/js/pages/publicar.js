// Publicar inmueble (publicar.html)
import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';
import { api } from '../api.js';
import { STORAGE, LIMITES } from '/shared/contrato.js';
import { predecirPrecio } from '../ml/prediccion.js';
import { formatearUSD } from '../utils/formato.js';
import { pintarErrores, limpiarErrores } from '../utils/formulario.js';

if (protegerPagina()) renderNavbar();

const form = document.getElementById('form-publicar');
const inputFotos = document.getElementById('input-fotos');
const previewFotos = document.getElementById('preview-fotos');
const comparativaPrecio = document.getElementById('comparativa-precio');
const btnPublicar = document.getElementById('btn-publicar');

const CAMPOS_MODELO = ['superficie_m2', 'num_habitaciones', 'zona', 'anio_construccion'];

let estimacionActual = null;
let urlsPreview = [];

inicializar();

function inicializar() {
  if (!form) return;

  cargarPrediccionGuardada();

  for (const nombre of CAMPOS_MODELO) {
    form.elements[nombre]?.addEventListener('change', recalcularEstimacion);
  }

  form.elements.precio_venta_usd?.addEventListener('input', mostrarComparativa);
  inputFotos?.addEventListener('change', manejarCambioFotos);
  form.addEventListener('submit', manejarEnvio);
}

// Precarga datos si el usuario llegó desde predecir.html
function cargarPrediccionGuardada() {
  const crudo = sessionStorage.getItem(STORAGE.PREDICCION_PENDIENTE);
  if (!crudo) return;

  try {
    const guardada = JSON.parse(crudo);
    for (const campo of CAMPOS_MODELO) {
      if (guardada[campo] != null && form.elements[campo]) {
        form.elements[campo].value = guardada[campo];
      }
    }

    if (Number.isFinite(Number(guardada.precio_estimado_usd))) {
      estimacionActual = {
        precio_estimado_usd: Number(guardada.precio_estimado_usd),
        version_modelo: guardada.version_modelo || '1.0.0',
      };
      mostrarComparativa();
    } else {
      recalcularEstimacion();
    }
  } catch {
    sessionStorage.removeItem(STORAGE.PREDICCION_PENDIENTE);
  }
}

async function recalcularEstimacion() {
  const datos = {
    superficie_m2: Number(form.elements.superficie_m2?.value),
    num_habitaciones: Number(form.elements.num_habitaciones?.value),
    zona: String(form.elements.zona?.value || '').trim().toLowerCase(),
    anio_construccion: Number(form.elements.anio_construccion?.value),
  };

  if (!datos.superficie_m2 || !datos.num_habitaciones || !datos.zona || !datos.anio_construccion) {
    return;
  }

  try {
    const res = await predecirPrecio(datos);
    estimacionActual = {
      precio_estimado_usd: res.precio_estimado_usd,
      version_modelo: res.version_modelo,
    };
    mostrarComparativa();
  } catch {
    // Si falla la carga del modelo, el propietario aún puede publicar manualmente
  }
}

// Muestra la referencia de la IA y alerta si el precio pedido difiere más del 20 %
function mostrarComparativa() {
  if (!comparativaPrecio || !estimacionActual) return;

  comparativaPrecio.hidden = false;
  comparativaPrecio.classList.remove('d-none');
  comparativaPrecio.replaceChildren();

  const estimado = estimacionActual.precio_estimado_usd;
  const pedido = Number(form.elements.precio_venta_usd?.value);

  const caja = document.createElement('div');

  if (!pedido || pedido <= 0) {
    caja.className = 'alert alert-secondary mb-0';
    caja.textContent = `Precio estimado por el modelo: ${formatearUSD(estimado)}.`;
    comparativaPrecio.append(caja);
    return;
  }

  const diferencia = (pedido - estimado) / estimado;
  const porcentaje = Math.round(Math.abs(diferencia) * 100);

  if (Math.abs(diferencia) > 0.2) {
    const sentido = diferencia > 0 ? 'por encima' : 'por debajo';
    caja.className = 'alert alert-warning mb-0';
    caja.textContent =
      `Tu precio pedido difiere en ${porcentaje} % (${sentido}) del valor estimado por el modelo ` +
      `(${formatearUSD(estimado)}).`;
  } else {
    caja.className = 'alert alert-success mb-0';
    caja.textContent =
      `Tu precio está dentro del rango recomendado frente a la estimación del modelo (${formatearUSD(estimado)}).`;
  }

  comparativaPrecio.append(caja);
}

function manejarCambioFotos() {
  limpiarErrorFotos();
  const archivos = Array.from(inputFotos?.files || []);
  const error = validarArchivosFotos(archivos);

  if (error) {
    pintarErrores(form, { fotos: error });
    inputFotos.value = '';
    limpiarPreviewFotos();
    return;
  }

  mostrarMiniaturas(archivos);
}

function validarArchivosFotos(archivos) {
  const { max, mb, tipos } = LIMITES.fotos;
  if (archivos.length > max) {
    return `Puedes subir como máximo ${max} fotos.`;
  }

  const maxBytes = mb * 1024 * 1024;
  for (const archivo of archivos) {
    if (!tipos.includes(archivo.type)) {
      return `Formato no permitido en "${archivo.name}". Usa JPG, PNG o WebP.`;
    }
    if (archivo.size > maxBytes) {
      return `La foto "${archivo.name}" supera el límite de ${mb} MB.`;
    }
  }
  return null;
}

function mostrarMiniaturas(archivos) {
  if (!previewFotos) return;
  limpiarPreviewFotos();

  if (archivos.length === 0) return;

  previewFotos.hidden = false;
  previewFotos.classList.remove('d-none');

  for (const archivo of archivos) {
    const url = URL.createObjectURL(archivo);
    urlsPreview.push(url);

    const contenedor = document.createElement('div');
    contenedor.className = 'd-inline-block me-2 mb-2 text-center';

    const img = document.createElement('img');
    img.src = url;
    img.alt = archivo.name;
    img.className = 'rounded border object-fit-cover';
    img.style.width = '96px';
    img.style.height = '72px';

    const nombre = document.createElement('div');
    nombre.className = 'small text-secondary text-truncate';
    nombre.style.maxWidth = '96px';
    nombre.textContent = archivo.name;

    contenedor.append(img, nombre);
    previewFotos.append(contenedor);
  }
}

function limpiarPreviewFotos() {
  for (const url of urlsPreview) URL.revokeObjectURL(url);
  urlsPreview = [];
  previewFotos?.replaceChildren();
}

function limpiarErrorFotos() {
  if (!inputFotos) return;
  inputFotos.classList.remove('is-invalid');
  const grupo = inputFotos.closest('.mb-3') || inputFotos.parentElement;
  grupo?.querySelectorAll('.invalid-feedback').forEach((el) => el.remove());
}

function validarCamposLocales() {
  const errores = {};
  const reglas = ['superficie_m2', 'num_habitaciones', 'anio_construccion', 'precio_venta_usd'];

  for (const campo of reglas) {
    const valor = Number(form.elements[campo]?.value);
    const { min, max } = LIMITES[campo];
    if (!Number.isFinite(valor) || valor < min || valor > max) {
      errores[campo] = `Debe estar entre ${min} y ${max}.`;
    }
  }

  const errorFotos = validarArchivosFotos(Array.from(inputFotos?.files || []));
  if (errorFotos) errores.fotos = errorFotos;

  return errores;
}

function mostrarErrorGeneral(mensaje) {
  let alerta = document.getElementById('alerta-publicar');
  if (!alerta) {
    alerta = document.createElement('div');
    alerta.id = 'alerta-publicar';
    alerta.className = 'alert alert-danger mt-3';
    btnPublicar?.insertAdjacentElement('beforebegin', alerta);
  }
  alerta.hidden = false;
  alerta.textContent = mensaje;
}

function ocultarErrorGeneral() {
  const alerta = document.getElementById('alerta-publicar');
  if (alerta) alerta.hidden = true;
}

async function manejarEnvio(e) {
  e.preventDefault();
  limpiarErrores(form);
  ocultarErrorGeneral();

  const erroresLocales = validarCamposLocales();
  if (Object.keys(erroresLocales).length > 0) {
    pintarErrores(form, erroresLocales);
    return;
  }

  if (!estimacionActual) {
    await recalcularEstimacion();
  }

  const formData = new FormData(form);
  if (estimacionActual) {
    formData.set('precio_estimado_usd', String(estimacionActual.precio_estimado_usd));
    formData.set('version_modelo', String(estimacionActual.version_modelo));
  }

  const textoOriginal = btnPublicar?.textContent || 'Publicar';
  if (btnPublicar) {
    btnPublicar.disabled = true;
    btnPublicar.textContent = 'Publicando…';
  }

  try {
    await api('/inmuebles', { metodo: 'POST', formData });
    sessionStorage.removeItem(STORAGE.PREDICCION_PENDIENTE);
    window.location.href = '/panel.html';
  } catch (err) {
    if (err.campos && Object.keys(err.campos).length > 0) {
      pintarErrores(form, err.campos);
    } else {
      mostrarErrorGeneral(err.mensaje || err.message || 'No se pudo publicar el inmueble.');
    }
  } finally {
    if (btnPublicar) {
      btnPublicar.disabled = false;
      btnPublicar.textContent = textoOriginal;
    }
  }
}