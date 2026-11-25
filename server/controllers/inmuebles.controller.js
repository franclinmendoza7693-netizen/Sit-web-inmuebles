import { matchedData } from 'express-validator';
import { POR_PAGINA } from '../../shared/contrato.js';
import { ApiError, creado, ok } from '../utils/respuesta.js';
import * as Inmueble from '../models/inmueble.model.js';

// GET /api/inmuebles
// Llega ya validado por inmuebles.routes.js; matchedData trae los valores ya convertidos.
export async function listar(req, res) {
  const { pagina = 1, orden = Inmueble.ORDEN_POR_DEFECTO, ...filtros } = matchedData(req, {
    locations: ['query'],
  });
  const { items, total } = await Inmueble.listarPublicados({
    filtros,
    orden,
    pagina,
    porPagina: POR_PAGINA,
  });
  return ok(res, { items, pagina, por_pagina: POR_PAGINA, total });
}

// POST /api/inmuebles (multipart/form-data)
// matchedData deja pasar solo los campos validados: lo que mande el cliente fuera de la lista
// (estado, id_usuario…) se ignora. El dueño sale siempre del token.
export async function crear(req, res) {
  const datos = matchedData(req, { locations: ['body'] });
  const rutasFotos = (req.files ?? []).map((foto) => `/uploads/inmuebles/${foto.filename}`);

  const id_inmueble = await Inmueble.crear(
    { ...datos, id_usuario: req.usuario.id_usuario },
    rutasFotos,
  );
  const inmueble = await Inmueble.buscarPublicadoPorId(id_inmueble);
  return creado(res, inmueble, 'Inmueble publicado');
}

// GET /api/inmuebles/mios
export async function listarMios(req, res) {
  const items = await Inmueble.listarPorUsuario(req.usuario.id_usuario);
  return ok(res, { items });
}

// PATCH /api/inmuebles/:id_inmueble/estado: solo el dueño puede cambiarlo
export async function cambiarEstado(req, res) {
  const { id_inmueble, estado } = matchedData(req);
  const idDueno = await Inmueble.buscarDueno(id_inmueble);
  if (idDueno === null) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'El inmueble no existe');
  }
  if (idDueno !== req.usuario.id_usuario) {
    throw new ApiError(403, 'SIN_PERMISO', 'Solo el dueño puede cambiar el estado del inmueble');
  }
  await Inmueble.actualizarEstado(id_inmueble, estado);
  return ok(res, { id_inmueble, estado }, 'Estado actualizado');
}

// GET /api/inmuebles/:id_inmueble
export async function detalle(req, res) {
  const { id_inmueble } = matchedData(req, { locations: ['params'] });
  const inmueble = await Inmueble.buscarPublicadoPorId(id_inmueble);
  if (!inmueble) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'El inmueble no existe o ya no está publicado');
  }
  return ok(res, inmueble);
}
