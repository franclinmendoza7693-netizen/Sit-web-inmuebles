import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import {
  reglasCaracteristicas,
  reglaPrecioEstimado,
  reglaVersionModelo,
} from '../middlewares/reglas-inmueble.js';
import { validar } from '../middlewares/validar.js';
import { listarMias, registrar } from '../controllers/predicciones.controller.js';

const router = Router();

const reglasPrediccion = [
  ...reglasCaracteristicas,
  reglaPrecioEstimado({ obligatorio: true }),
  reglaVersionModelo({ obligatorio: true }),
];

router.post('/', verificarToken, reglasPrediccion, validar, registrar);
router.get('/mias', verificarToken, listarMias);

export default router;
