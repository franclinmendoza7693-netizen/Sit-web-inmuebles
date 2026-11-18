// Panel del propietario
import { renderNavbar } from '../components/navbar.js';
import { protegerPagina } from '../auth.js';

if (protegerPagina()) renderNavbar();

// TODO: pestaña "Mis inmuebles" con tarjetas, su estado y cambio de estado
// (GET /api/inmuebles/mios, PATCH /api/inmuebles/:id_inmueble/estado); pestaña "Mis consultas"
// con tabla de fecha, datos y precio estimado (GET /api/predicciones/mias); estados de carga,
// vacío y error en ambas.
