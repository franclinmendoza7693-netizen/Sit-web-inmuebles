import { TIPO_CAMBIO } from '../config.js';
import { ETIQUETAS } from '/shared/contrato.js';

export function formatearUSD(monto) {
  const num = Number(monto) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatearPEN(montoUSD) {
  const num = Number(montoUSD) || 0;
  const enSoles = Math.round(num * TIPO_CAMBIO);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(enSoles);
}

export function formatearFecha(isoString) {
  if (!isoString) return '-';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function etiqueta(clave) {
  if (!clave) return '';
  return ETIQUETAS[clave] || clave.charAt(0).toUpperCase() + clave.slice(1);
}