import { Router } from 'express';
import { ROL_ADMIN } from '../../shared/contrato.js';
import { soloRol, verificarToken } from '../middlewares/auth.js';
import { exportarEntrenamiento } from '../controllers/dataset.controller.js';

const router = Router();

router.get('/entrenamiento', verificarToken, soloRol(ROL_ADMIN), exportarEntrenamiento);

export default router;
