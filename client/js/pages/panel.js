// Panel del propietario
import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';
// import { api } from '../api.js';

if (protegerPagina()) renderNavbar();

// TODO:
// Pestaña "Mis inmuebles":  await api('/inmuebles/mios')  → tarjetas con su estado
//   y cambio de estado con api(`/inmuebles/${id}/estado`, { metodo: 'PATCH', datos: { estado } })
// Pestaña "Mis consultas":  await api('/predicciones/mias') → tabla con fecha, datos y precio estimado
// Estados de carga, vacío y error en ambas pestañas.
