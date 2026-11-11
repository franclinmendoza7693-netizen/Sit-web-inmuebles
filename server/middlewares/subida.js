// Subida de fotos con multer — dueño: Dev A (día 3)
// Uso: router.post('/', verificarToken, subirFotos, …)  → archivos en req.files
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { LIMITES } from '../../shared/contrato.js';
import { ApiError } from '../utils/respuesta.js';

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const DESTINO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/inmuebles');

const almacenamiento = multer.diskStorage({
  destination: DESTINO, // la ruta pública será /uploads/inmuebles/<archivo>

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONES[file.mimetype] || path.extname(file.originalname)}`);
  },
});

export const subirFotos = multer({
  storage: almacenamiento,
  limits: { fileSize: LIMITES.fotos.mb * 1024 * 1024, files: LIMITES.fotos.max },
  fileFilter: (req, file, cb) => {
    if (LIMITES.fotos.tipos.includes(file.mimetype)) return cb(null, true);
    return cb(new ApiError(400, 'VALIDACION', 'Formato de foto no permitido', { fotos: 'Solo JPG, PNG o WebP' }));
  },
}).array('fotos', LIMITES.fotos.max); // el input se llama name="fotos"
