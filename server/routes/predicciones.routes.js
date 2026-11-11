// Rutas de predicciones (historial de consultas) — dueño: Dev A (día 3)
// La predicción se calcula en el navegador; aquí solo se guarda y se lista.
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { registrar, listarMias } from '../controllers/predicciones.controller.js';

const router = Router();

router.post('/', verificarToken, registrar);
router.get('/mias', verificarToken, listarMias);

export default router;
