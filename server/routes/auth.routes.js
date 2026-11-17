// Rutas de autenticación — dueño: Dev A
// Las reglas de validación salen de shared/contrato.js (las mismas que usa el frontend).
import { Router } from 'express';
import { body } from 'express-validator';
import { REGEX, MENSAJES } from '../../shared/contrato.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';
import { registro, login, perfil } from '../controllers/auth.controller.js';

const router = Router();

const reglasRegistro = [
  body('dni').trim().matches(REGEX.dni).withMessage(MENSAJES.dni),
  body('nombres')
    .trim()
    .notEmpty().withMessage('Ingresa tus nombres')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres'),
  body('apellidos')
    .trim()
    .notEmpty().withMessage('Ingresa tus apellidos')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres'),
  body('telefono')
    .optional({ values: 'falsy' })
    .trim()
    .matches(REGEX.telefono).withMessage(MENSAJES.telefono),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Correo no válido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),
  body('password')
    .isString().withMessage(MENSAJES.password)
    .bail()
    .matches(REGEX.password).withMessage(MENSAJES.password),
];

router.post('/registro', reglasRegistro, validar, registro); // dni, nombres, apellidos, telefono, email, password
router.post('/login', login); // día 2: dni, password (+ express-rate-limit: 5 intentos / 15 min)
router.get('/perfil', verificarToken, perfil);

export default router;
