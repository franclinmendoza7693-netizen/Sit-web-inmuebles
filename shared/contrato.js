// =====================================================================
// shared/contrato.js — ÚNICA FUENTE DE VERDAD del proyecto
// ---------------------------------------------------------------------
// Lo importan el servidor (import { ZONAS } from '../shared/contrato.js')
// y el navegador (import { ZONAS } from '/shared/contrato.js').
//
// Reglas:
//  1. Nadie inventa un nombre nuevo dentro de su rama de trabajo.
//  2. Un cambio aquí va en un PR que solo trae ese cambio: "contrato: …".
//  3. Lo aprueban los otros dos, se avisa en el canal y se sube VERSION_CONTRATO.
// =====================================================================

export const VERSION_CONTRATO = '1.0.0';

// ---------- Valores cerrados (siempre minúsculas y sin tildes) ----------
// zona = la "Ubicación" del enunciado (no confundir con distrito/dirección)
export const ZONAS = ['centro', 'suburbio', 'rural'];
export const TIPOS_INMUEBLE = ['casa', 'departamento'];
export const ESTADOS_INMUEBLE = ['publicado', 'pausado', 'vendido'];
export const ROLES = ['propietario', 'admin'];
export const ORDENES = ['recientes', 'precio_asc', 'precio_desc'];

// Texto bonito para mostrar en pantalla
export const ETIQUETAS = {
  centro: 'Centro',
  suburbio: 'Suburbio',
  rural: 'Rural',
  casa: 'Casa',
  departamento: 'Departamento',
  publicado: 'Publicado',
  pausado: 'Pausado',
  vendido: 'Vendido',
  propietario: 'Propietario',
  admin: 'Administrador',
  recientes: 'Más recientes',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
};

// ---------- Límites de validación (front y back usan los mismos) ----------
export const LIMITES = {
  superficie_m2: { min: 20, max: 1000 },
  num_habitaciones: { min: 1, max: 10 },
  anio_construccion: { min: 1950, max: new Date().getFullYear() },
  precio_venta_usd: { min: 5000, max: 5000000 },
  fotos: { max: 5, mb: 2, tipos: ['image/jpeg', 'image/png', 'image/webp'] },
};

export const REGEX = {
  dni: /^\d{8}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // 8+ con mayúscula, minúscula y número
  telefono: /^9\d{8}$/,
};

export const MENSAJES = {
  dni: 'El DNI debe tener exactamente 8 dígitos',
  password: 'Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número',
  telefono: 'El celular debe tener 9 dígitos y empezar con 9',
};

// ---------- Modelo de ML ----------
// Orden EXACTO del vector de entrada del modelo. Nunca reordenar.
export const ENTRADAS_MODELO = [
  'superficie_m2',
  'num_habitaciones',
  'anio_construccion',
  'zona_centro',
  'zona_suburbio',
  'zona_rural',
];

// ---------- Navegador ----------
export const STORAGE = {
  TOKEN: 'ip_token', // localStorage
  USUARIO: 'ip_usuario', // localStorage
  PREDICCION_PENDIENTE: 'ip_prediccion', // sessionStorage: lleva datos de predecir → publicar
};

// ---------- API ----------
export const CODIGOS_ERROR = [
  'VALIDACION',
  'DNI_DUPLICADO',
  'CREDENCIALES_INVALIDAS',
  'NO_AUTENTICADO',
  'SIN_PERMISO',
  'NO_ENCONTRADO',
  'DEMASIADOS_INTENTOS',
  'ERROR_SERVIDOR',
];

export const POR_PAGINA = 12; // inmuebles por página en el catálogo
