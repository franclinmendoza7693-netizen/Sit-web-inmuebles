// Panel del propietario — dueño: Dev C (día 4)
import { renderNavbar } from '../componentes/navbar.js';
import { protegerPagina } from '../auth.js';
// import { api } from '../api.js';

if (protegerPagina()) renderNavbar();

// TODO (Dev C, día 4):
// Pestaña "Mis inmuebles":  await api('/inmuebles/mios')  → tarjetas con su estado
//   y cambio de estado con api(`/inmuebles/${id}/estado`, { metodo: 'PATCH', datos: { estado } })
// Pestaña "Mis consultas":  await api('/predicciones/mias') → tabla con fecha, datos y precio estimado
// Estados de carga, vacío y error en ambas pestañas.
