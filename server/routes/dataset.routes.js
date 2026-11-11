// Dataset para reentrenar el modelo — dueño: Dev A (día 4)
import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.js';
import { exportarEntrenamiento } from '../controllers/dataset.controller.js';

const router = Router();

router.get('/entrenamiento', verificarToken, soloRol('admin'), exportarEntrenamiento);

export default router;
