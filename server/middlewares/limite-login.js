// Frena la fuerza bruta: 5 logins con credenciales incorrectas (401) por IP cada 15 minutos.
// Solo cuentan los 401: un login exitoso, un dato mal formado (400) o una caída del servidor
// (500) no deben gastar los intentos de un usuario legítimo.
import rateLimit from 'express-rate-limit';
import { fallo } from '../utils/respuesta.js';

export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode !== 401,
  standardHeaders: 'draft-7', // cabeceras RateLimit-* para que el cliente sepa cuánto falta
  legacyHeaders: false,
  handler: (req, res) =>
    fallo(res, 429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo'),
});
