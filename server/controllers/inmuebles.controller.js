// Controlador de inmuebles — dueño: Dev A (días 3 y 4)
import { pendiente } from '../utils/respuesta.js';
// import * as Inmueble from '../models/inmueble.model.js';

// GET /api/inmuebles → ok(res, { items, pagina, por_pagina, total })   (solo estado = 'publicado')
export async function listar(req, res) {
  return pendiente(res);
}

// GET /api/inmuebles/mios → ok(res, { items })   (todos los estados del usuario)
export async function listarMios(req, res) {
  return pendiente(res);
}

// GET /api/inmuebles/:id_inmueble → inmueble + fotos[] + contacto { nombres, telefono }
export async function obtener(req, res) {
  return pendiente(res);
}

// POST /api/inmuebles (multipart) → campos del inmueble + req.files (fotos)
// Guardar ruta pública de cada foto como /uploads/inmuebles/<filename>
export async function crear(req, res) {
  return pendiente(res);
}

// PUT /api/inmuebles/:id_inmueble → solo el dueño (si no: 403 SIN_PERMISO)
export async function actualizar(req, res) {
  return pendiente(res);
}

// PATCH /api/inmuebles/:id_inmueble/estado → { estado } ∈ ESTADOS_INMUEBLE
export async function cambiarEstado(req, res) {
  return pendiente(res);
}
