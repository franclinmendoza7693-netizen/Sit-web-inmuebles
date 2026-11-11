// Formatos de pantalla (es-PE) — dueño: Dev C
// Regla del contrato: todo el dinero se guarda y viaja en USD completos; los soles solo se calculan aquí.
import { TIPO_CAMBIO } from '../config.js';
import { ETIQUETAS } from '/shared/contrato.js';

const usd = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pen = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

export const formatearUSD = (precio_usd) => usd.format(precio_usd);
export const formatearPEN = (precio_usd) => pen.format(precio_usd * TIPO_CAMBIO); // recibe USD, muestra soles
export const formatearM2 = (m2) => `${numero.format(m2)} m²`;
export const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
export const etiqueta = (valor) => ETIQUETAS[valor] ?? valor;
