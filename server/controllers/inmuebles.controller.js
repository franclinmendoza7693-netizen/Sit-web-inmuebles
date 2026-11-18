import { matchedData } from 'express-validator';
import { POR_PAGINA } from '../../shared/contrato.js';
import { ApiError, ok } from '../utils/respuesta.js';
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

// GET /api/inmuebles/:id_inmueble
export async function detalle(req, res) {
  const { id_inmueble } = matchedData(req, { locations: ['params'] });
  const inmueble = await Inmueble.buscarPublicadoPorId(id_inmueble);
  if (!inmueble) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'El inmueble no existe o ya no está publicado');
  }
  return ok(res, inmueble);
}
