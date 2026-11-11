// Controlador de autenticación — dueño: Dev A (día 2)
import { pendiente } from '../utils/respuesta.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import * as Usuario from '../models/usuario.model.js';

// POST /api/auth/registro
// 1. Si el DNI ya existe → 409 DNI_DUPLICADO
// 2. password_hash = await bcrypt.hash(password, 10)
// 3. Responder creado(res, usuario) SIN password_hash
export async function registro(req, res) {
  return pendiente(res);
}

// POST /api/auth/login
// Si el DNI no existe o la contraseña no coincide → 401 CREDENCIALES_INVALIDAS (mismo mensaje en ambos casos)
// token = jwt.sign({ id_usuario, dni, nombres, rol }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRA })
// Responder ok(res, { token, usuario: { id_usuario, dni, nombres, rol } })
export async function login(req, res) {
  return pendiente(res);
}

// GET /api/auth/perfil  → datos de req.usuario.id_usuario
export async function perfil(req, res) {
  return pendiente(res);
}
