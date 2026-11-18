import { renderNavbar } from '../components/navbar.js';
import { STORAGE } from '/shared/contrato.js';
import { TIPO_CAMBIO } from '../config.js';
import { predecirPrecio } from '../ml/prediccion.js';
import { formatearUSD, formatearPEN } from '../utils/formato.js';
import { api } from '../api.js';

// Cargar navbar de forma estándar
renderNavbar();

// Elementos acordados en sección 7.1 del plan
const form = document.getElementById('form-prediccion');
const btnPredecir = document.getElementById('btn-predecir');

const contResultado = document.getElementById('resultado-prediccion');
const txtPrecioUSD = document.getElementById('resultado-precio-usd');
const txtPrecioPEN = document.getElementById('resultado-precio-pen');
const txtRango = document.getElementById('resultado-rango');
const avisoFueraRango = document.getElementById('aviso-fuera-rango');
const btnIrPublicar = document.getElementById('btn-ir-publicar');
const contHistorial = document.getElementById('historial-predicciones');

let ultimaPrediccion = null;

// Intentar cargar historial previo si la API ya responde
cargarHistorial();

// Manejo del formulario
form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const datos = {
    superficie_m2: Number(formData.get('superficie_m2')),
    num_habitaciones: Number(formData.get('num_habitaciones')),
    zona: formData.get('zona'),
    anio_construccion: Number(formData.get('anio_construccion')),
  };

  btnPredecir.disabled = true;
  const textoOriginal = btnPredecir.innerHTML;
  btnPredecir.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculando...';

  try {
    // 1. Inferencia real con el modelo
    const res = await predecirPrecio(datos);

    // 2. Pintar en pantalla (USD y PEN)
    if (txtPrecioUSD) txtPrecioUSD.textContent = formatearUSD(res.precio_estimado_usd);
    if (txtPrecioPEN) txtPrecioPEN.textContent = formatearPEN(res.precio_estimado_usd);
    if (txtRango) txtRango.textContent = `${formatearUSD(res.rango_min_usd)} — ${formatearUSD(res.rango_max_usd)}`;

    // 3. Aviso si está fuera de rango (quitando 'hidden')
    if (avisoFueraRango) {
      if (res.fuera_de_rango) {
        avisoFueraRango.hidden = false;
        avisoFueraRango.classList.remove('d-none');
        avisoFueraRango.textContent = '⚠️ Las características de este inmueble están fuera del rango típico. La estimación puede tener menor precisión.';
      } else {
        avisoFueraRango.hidden = true;
        avisoFueraRango.classList.add('d-none');
      }
    }

    // 4. Mostrar el contenedor de resultados (quitando 'hidden')
    if (contResultado) {
      contResultado.hidden = false;
      contResultado.classList.remove('d-none');
    }

    // Guardar para el botón "Ir a publicar"
    ultimaPrediccion = {
      ...datos,
      precio_estimado_usd: res.precio_estimado_usd,
      version_modelo: res.version_modelo,
    };

    // 5. Guardar en backend si la API ya está lista (sin romper pantalla si no lo está)
    guardarEnApi(ultimaPrediccion);
  } catch (err) {
    alert(`Error al calcular estimación: ${err.message}`);
    console.error(err);
  } finally {
    btnPredecir.disabled = false;
    btnPredecir.innerHTML = textoOriginal;
  }
});

// Botón "Ir a publicar": guarda en sessionStorage y redirige
btnIrPublicar?.addEventListener('click', () => {
  if (!ultimaPrediccion) return;
  sessionStorage.setItem(STORAGE.PREDICCION_PENDIENTE, JSON.stringify(ultimaPrediccion));
  window.location.href = '/publicar.html';
});

async function guardarEnApi(prediccion) {
  try {
    await api('/predicciones', {
      metodo: 'POST',
      datos: prediccion,
    });
    cargarHistorial();
  } catch (err) {
    console.warn('API /predicciones aún pendiente o no autenticado:', err.message);
  }
}

async function cargarHistorial() {
  if (!contHistorial) return;
  try {
    const data = await api('/predicciones/mias');
    if (data && Array.isArray(data) && data.length > 0) {
      contHistorial.innerHTML = `
        <h6 class="mt-4 mb-2">Tus consultas recientes:</h6>
        <div class="list-group">
          ${data.slice(0, 5).map((p) => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>${p.superficie_m2} m² · ${p.num_habitaciones} hab. · ${p.zona}</strong>
                <div class="small text-secondary">Año ${p.anio_construccion}</div>
              </div>
              <span class="badge bg-primary rounded-pill fs-6">${formatearUSD(p.precio_estimado_usd)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch {
    // Silencioso si no hay sesión o API pendiente
  }
}