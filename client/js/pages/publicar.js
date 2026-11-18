// Publicar inmueble (publicar.html)
import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';

if (protegerPagina()) renderNavbar();

// TODO: rellenar el formulario con la predicción guardada en sessionStorage (superficie_m2,
// num_habitaciones, zona, anio_construccion, precio_estimado_usd y version_modelo) o, si no
// hay, calcularla al cambiar esos 4 campos; comparar precio pedido vs. estimado en
// #comparativa-precio (alerta si difieren más de 20 %); validar las fotos con LIMITES.fotos y
// mostrar miniaturas en #preview-fotos; enviar con POST /api/inmuebles (FormData) y, al éxito,
// borrar la predicción guardada y redirigir a /panel.html.
