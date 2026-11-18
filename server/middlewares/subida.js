// Subida de fotos con multer
// Uso: router.post('/', verificarToken, subirFotos, borrarFotosSiFalla, …)  → archivos en req.files
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { LIMITES } from '../../shared/contrato.js';
import { ApiError } from '../utils/respuesta.js';

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const DESTINO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads/inmuebles');

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

// multer guarda las fotos antes de que se validen los demás campos. Si la petición termina con error
// (datos inválidos, fallo al guardar en la base), esas fotos quedarían huérfanas en el disco: se borran.
export function borrarFotosSiFalla(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 400) return;
    for (const foto of req.files ?? []) {
      fs.unlink(foto.path).catch(() => {}); // si ya no existe, no hay nada que borrar
    }
  });
  next();
}
