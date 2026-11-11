// Rutas de autenticación — dueño: Dev A (día 2)
// Las validaciones (express-validator + validar) se agregan aquí, usando REGEX y MENSAJES del contrato.
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { registro, login, perfil } from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', registro); // dni, nombres, apellidos, telefono, email, password
router.post('/login', login); // dni, password  (agregar express-rate-limit: 5 intentos / 15 min)
router.get('/perfil', verificarToken, perfil);

export default router;
