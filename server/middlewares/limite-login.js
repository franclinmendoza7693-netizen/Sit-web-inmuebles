// Frena la fuerza bruta: 5 logins FALLIDOS por IP cada 15 minutos.
// Los exitosos no cuentan (skipSuccessfulRequests), así un usuario legítimo no se bloquea.
import rateLimit from 'express-rate-limit';
import { fallo } from '../utils/respuesta.js';

export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7', // cabeceras RateLimit-* para que el cliente sepa cuánto falta
  legacyHeaders: false,
  handler: (req, res) =>
    fallo(res, 429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo'),
});
