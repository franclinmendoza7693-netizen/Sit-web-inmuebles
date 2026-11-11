// Estimar precio (predecir.html) — dueño: Dev B
// Usa los IDs acordados en la sección 7.1 del plan. Funciona ya con el modelo simulado.
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
import { predecirPrecio } from '../modelo/prediccion.js';
import { formatearUSD, formatearPEN } from '../utils/formato.js';
import { leerFormulario } from '../utils/formulario.js';
import { STORAGE } from '/shared/contrato.js';
// import { api } from '../api.js';

if (protegerPagina()) renderNavbar();

const form = document.getElementById('form-prediccion');
const resultado = document.getElementById('resultado-prediccion');
let ultimaPrediccion = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const datos = leerFormulario(form);
  const r = await predecirPrecio(datos);
  ultimaPrediccion = { ...datos, ...r };

  document.getElementById('resultado-precio-usd').textContent = formatearUSD(r.precio_estimado_usd);
  document.getElementById('resultado-precio-pen').textContent = formatearPEN(r.precio_estimado_usd);
  document.getElementById('resultado-rango').textContent =
    `Rango probable: ${formatearUSD(r.rango_min_usd)} – ${formatearUSD(r.rango_max_usd)} · modelo ${r.version_modelo}`;
  document.getElementById('aviso-fuera-rango').hidden = !r.fuera_de_rango;
  resultado.hidden = false;

  // TODO (Dev B, día 3): guardar la consulta en el historial
  // await api('/predicciones', { metodo: 'POST', datos: { ...datos, precio_estimado_usd: r.precio_estimado_usd, version_modelo: r.version_modelo } });
});

// Lleva los datos a publicar.html (sección 7.1: btn-ir-publicar + sessionStorage ip_prediccion)
document.getElementById('btn-ir-publicar').addEventListener('click', () => {
  if (!ultimaPrediccion) return;
  sessionStorage.setItem(STORAGE.PREDICCION_PENDIENTE, JSON.stringify(ultimaPrediccion));
  location.href = '/publicar.html';
});

// TODO (Dev B, día 3): listar el historial en #historial-predicciones con api('/predicciones/mias')
