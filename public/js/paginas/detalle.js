// Detalle de un inmueble (detalle.html?id=12) — dueño: Dev C (día 3)
import { renderNavbar } from '../componentes/navbar.js';
// import { api } from '../api.js';
// import { formatearUSD, formatearPEN, formatearM2, etiqueta } from '../utils/formato.js';

renderNavbar();

// TODO (Dev C, día 3):
// 1. const id = new URLSearchParams(location.search).get('id')
// 2. const inmueble = await api(`/inmuebles/${id}`)   → incluye fotos[] y contacto { nombres, telefono }
// 3. Galería (carousel de Bootstrap), precio USD y S/, datos, descripción y botón de contacto.
// 4. Si la API responde NO_ENCONTRADO → mensaje amable y enlace al catálogo.
