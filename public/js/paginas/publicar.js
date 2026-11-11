// Publicar inmueble (publicar.html) — dueño: Dev B (día 4)
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
// import { api } from '../api.js';
// import { predecirPrecio } from '../modelo/prediccion.js';
// import { pintarErrores } from '../utils/formulario.js';
// import { formatearUSD } from '../utils/formato.js';
// import { STORAGE, LIMITES } from '/shared/contrato.js';

if (protegerPagina()) renderNavbar();

// TODO (Dev B, día 4):
// 1. Si existe sessionStorage[STORAGE.PREDICCION_PENDIENTE], rellenar el formulario
//    (superficie_m2, num_habitaciones, zona, anio_construccion) y los ocultos
//    precio_estimado_usd y version_modelo.
// 2. Si no existe, calcular la predicción al cambiar esos 4 campos.
// 3. #comparativa-precio: precio pedido vs. estimado; alerta si difieren más de 20 %.
// 4. #input-fotos: validar con LIMITES.fotos y mostrar miniaturas en #preview-fotos.
// 5. Enviar: const formData = new FormData(form); await api('/inmuebles', { metodo: 'POST', formData })
// 6. Éxito → borrar ip_prediccion de sessionStorage y redirigir a /panel.html.
