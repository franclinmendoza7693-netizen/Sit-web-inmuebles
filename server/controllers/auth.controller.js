import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ok, creado, fallo, pendiente } from '../utils/respuesta.js';
import * as Usuario from '../models/usuario.model.js';

const RONDAS_BCRYPT = 10;

// POST /api/auth/registro
// Llega ya validado por las reglas de auth.routes.js.
export async function registro(req, res) {
  const { dni, nombres, apellidos, telefono, email, password } = req.body;

  if (await Usuario.existeDni(dni)) {
    return fallo(res, 409, 'DNI_DUPLICADO', 'Ya existe una cuenta con ese DNI', {
      dni: 'Este DNI ya está registrado',
    });
  }

  const password_hash = await bcrypt.hash(password, RONDAS_BCRYPT);

  try {
    // Siempre se registra como propietario: el rol admin solo se crea con el seed
    const usuario = await Usuario.crear({ dni, nombres, apellidos, telefono, email, password_hash });
    return creado(res, usuario, 'Cuenta creada. Ya puedes iniciar sesión.');
  } catch (err) {
    // Dos registros con el mismo DNI al mismo tiempo: la BD lo frena con la llave UNIQUE
    if (err.code === 'ER_DUP_ENTRY') {
      return fallo(res, 409, 'DNI_DUPLICADO', 'Ya existe una cuenta con ese DNI', {
        dni: 'Este DNI ya está registrado',
      });
    }
    throw err; // lo responde manejarErrores como ERROR_SERVIDOR
  }
}

// Hash de relleno: si el DNI no existe igual hacemos un bcrypt.compare, para que
// "DNI inexistente" y "contraseña incorrecta" tarden lo mismo y no se pueda averiguar qué DNI existen.
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-usuario', RONDAS_BCRYPT);

// POST /api/auth/login
// DNI inexistente o contraseña incorrecta → 401 CREDENCIALES_INVALIDAS (mismo mensaje en ambos casos)
export async function login(req, res) {
  const { dni, password } = req.body;

  const usuario = await Usuario.buscarPorDni(dni);
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_RELLENO);

  if (!usuario || !coincide) {
    return fallo(res, 401, 'CREDENCIALES_INVALIDAS', 'DNI o contraseña incorrectos');
  }

  // El token lleva solo lo necesario; nunca el hash ni datos sensibles
  const datos = { id_usuario: usuario.id_usuario, dni: usuario.dni, nombres: usuario.nombres, rol: usuario.rol };
  const token = jwt.sign(datos, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRA });

  return ok(res, { token, usuario: datos }, 'Sesión iniciada');
}

// GET /api/auth/perfil — día 2  → datos de req.usuario.id_usuario
export async function perfil(req, res) {
  return pendiente(res);
}
