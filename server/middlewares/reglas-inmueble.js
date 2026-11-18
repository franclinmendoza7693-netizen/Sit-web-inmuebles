// Reglas de validación que comparten publicar un inmueble y guardar una predicción:
// las 4 características que usa el modelo, el precio que estimó y la versión del modelo.
import { body } from 'express-validator';
import { LIMITES, ZONAS } from '../../shared/contrato.js';

const PRECIO_ESTIMADO_MAX = 9_999_999_999; // lo que cabe en la columna DECIMAL(12,2)
const VERSION_MODELO_MAX = 10;

export const entre = ({ min, max }) => `Debe estar entre ${min} y ${max}`;

// Los valores llegan como texto (multipart/form-data) o como JSON: aquí se validan y se convierten
export const reglasCaracteristicas = [
  body('zona').isIn(ZONAS).withMessage(`Debe ser una de: ${ZONAS.join(', ')}`),
  body('superficie_m2')
    .isFloat(LIMITES.superficie_m2)
    .withMessage(entre(LIMITES.superficie_m2))
    .bail()
    .toFloat(),
  body('num_habitaciones')
    .isInt(LIMITES.num_habitaciones)
    .withMessage(entre(LIMITES.num_habitaciones))
    .bail()
    .toInt(),
  body('anio_construccion')
    .isInt(LIMITES.anio_construccion)
    .withMessage(entre(LIMITES.anio_construccion))
    .bail()
    .toInt(),
];

// Al publicar son opcionales (se puede publicar sin predecir); al guardar una predicción, no
const campo = (nombre, { obligatorio }) =>
  obligatorio ? body(nombre) : body(nombre).optional({ values: 'falsy' });

export const reglaPrecioEstimado = (opciones) =>
  campo('precio_estimado_usd', opciones)
    .isFloat({ min: 0, max: PRECIO_ESTIMADO_MAX })
    .withMessage('Debe ser un número mayor o igual a 0')
    .bail()
    .toFloat();

export const reglaVersionModelo = (opciones) =>
  campo('version_modelo', opciones)
    .trim()
    .notEmpty()
    .withMessage('Este dato es obligatorio')
    .bail()
    .isLength({ max: VERSION_MODELO_MAX })
    .withMessage(`Máximo ${VERSION_MODELO_MAX} caracteres`);
