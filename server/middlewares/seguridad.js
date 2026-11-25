// Cabeceras de seguridad (helmet) con su Content-Security-Policy:
// el navegador solo carga lo propio y las librerías de jsDelivr.
import helmet from 'helmet';

const CDN = 'https://cdn.jsdelivr.net';

// TensorFlow.js y tfjs-vis generan código al vuelo y sin 'unsafe-eval' no funcionan:
// el permiso se concede solo a las páginas que los cargan.
const PAGINAS_CON_MODELO = ['/predecir.html', '/publicar.html', '/admin/entrenamiento.html'];

const crearCabeceras = (scriptSrc) =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc,
        styleSrc: ["'self'", CDN, "'unsafe-inline'"],
        fontSrc: ["'self'", CDN],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  });

const estrictas = crearCabeceras(["'self'", CDN]);
const conModelo = crearCabeceras(["'self'", CDN, "'unsafe-eval'"]);

export function cabecerasSeguridad(req, res, next) {
  const aplicar = PAGINAS_CON_MODELO.includes(req.path) ? conModelo : estrictas;
  return aplicar(req, res, next);
}
