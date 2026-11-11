// Rutas de inmuebles — dueño: Dev A (días 3 y 4)
// IMPORTANTE: '/mios' va ANTES que '/:id_inmueble', o Express nunca la alcanza.
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { subirFotos } from '../middlewares/subida.js';
import {
  listar,
  listarMios,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
} from '../controllers/inmuebles.controller.js';

const router = Router();

router.get('/', listar); // ?tipo_inmueble&zona&distrito&precio_min&precio_max&orden&pagina
router.get('/mios', verificarToken, listarMios);
router.get('/:id_inmueble', obtener);
router.post('/', verificarToken, subirFotos, crear); // multipart/form-data
router.put('/:id_inmueble', verificarToken, actualizar); // solo el dueño
router.patch('/:id_inmueble/estado', verificarToken, cambiarEstado); // solo el dueño

export default router;
