import { Router } from 'express';
import { param, query } from 'express-validator';
import { ORDENES, TIPOS_INMUEBLE, ZONAS } from '../../shared/contrato.js';
import { validar } from '../middlewares/validar.js';
import { detalle, listar } from '../controllers/inmuebles.controller.js';

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

router.get('/', reglasListado, validar, listar);
router.get('/:id_inmueble', reglasDetalle, validar, detalle);

export default router;
