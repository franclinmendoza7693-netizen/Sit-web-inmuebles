import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { LIMITES, ORDENES, TIPOS_INMUEBLE, ZONAS } from '../../shared/contrato.js';
import { verificarToken } from '../middlewares/auth.js';
import {
  entre,
  reglasCaracteristicas,
  reglaPrecioEstimado,
  reglaVersionModelo,
} from '../middlewares/reglas-inmueble.js';
import { borrarFotosSiFalla, subirFotos } from '../middlewares/subida.js';
import { validar } from '../middlewares/validar.js';
import { crear, detalle, listar } from '../controllers/inmuebles.controller.js';

const router = Router();

const opcional = { values: 'falsy' }; // un filtro vacío ("?zona=") equivale a no enviarlo

// precio_min solo se compara cuando precio_max también es un entero válido
const noSuperaAlMaximo = (min, { req }) => {
  const max = req.query.precio_max;
  return !max || !Number.isInteger(Number(max)) || min <= Number(max);
};

const reglasListado = [
  query('tipo_inmueble')
    .optional(opcional)
    .isIn(TIPOS_INMUEBLE)
    .withMessage(`Debe ser uno de: ${TIPOS_INMUEBLE.join(', ')}`),
  query('zona').optional(opcional).isIn(ZONAS).withMessage(`Debe ser una de: ${ZONAS.join(', ')}`),
  query('distrito')
    .optional(opcional)
    .trim()
    .isLength({ max: 60 })
    .withMessage('Máximo 60 caracteres'),
  query('precio_min')
    .optional(opcional)
    .isInt({ min: 0 })
    .withMessage('Debe ser un entero mayor o igual a 0')
    .bail()
    .toInt()
    .custom(noSuperaAlMaximo)
    .withMessage('No puede ser mayor que precio_max'),
  query('precio_max')
    .optional(opcional)
    .isInt({ min: 0 })
    .withMessage('Debe ser un entero mayor o igual a 0')
    .bail()
    .toInt(),
  query('orden')
    .optional(opcional)
    .isIn(ORDENES)
    .withMessage(`Debe ser uno de: ${ORDENES.join(', ')}`),
  query('pagina')
    .optional(opcional)
    .isInt({ min: 1 })
    .withMessage('Debe ser un entero mayor o igual a 1')
    .bail()
    .toInt(),
];

const reglasDetalle = [
  param('id_inmueble').isInt({ min: 1 }).withMessage('Debe ser un entero positivo').bail().toInt(),
];

const DESCRIPCION_MAX = 2000;

const textoObligatorio = (campo, max) =>
  body(campo)
    .trim()
    .notEmpty()
    .withMessage('Este dato es obligatorio')
    .bail()
    .isLength({ max })
    .withMessage(`Máximo ${max} caracteres`);
const textoOpcional = (campo, max) =>
  body(campo).optional(opcional).trim().isLength({ max }).withMessage(`Máximo ${max} caracteres`);

// Los campos llegan como texto (multipart/form-data): los números se validan y se convierten aquí
const reglasPublicar = [
  textoObligatorio('titulo', 120),
  textoOpcional('descripcion', DESCRIPCION_MAX),
  body('tipo_inmueble')
    .isIn(TIPOS_INMUEBLE)
    .withMessage(`Debe ser uno de: ${TIPOS_INMUEBLE.join(', ')}`),
  textoObligatorio('region', 60),
  textoObligatorio('provincia', 60),
  textoObligatorio('distrito', 60),
  textoOpcional('direccion', 150),
  ...reglasCaracteristicas,
  body('precio_venta_usd')
    .isFloat(LIMITES.precio_venta_usd)
    .withMessage(entre(LIMITES.precio_venta_usd))
    .bail()
    .toFloat(),
  // Vienen de la predicción del modelo
  reglaPrecioEstimado({ obligatorio: false }),
  reglaVersionModelo({ obligatorio: false }),
];

router.get('/', reglasListado, validar, listar);
// Orden: token → fotos → reglas. Si algo falla después de subir las fotos, se borran del disco
router.post('/', verificarToken, subirFotos, borrarFotosSiFalla, reglasPublicar, validar, crear);
router.get('/:id_inmueble', reglasDetalle, validar, detalle);

export default router;
