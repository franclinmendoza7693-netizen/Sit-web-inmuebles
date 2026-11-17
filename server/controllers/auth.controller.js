// Controlador de autenticación — dueño: Dev A
import bcrypt from 'bcryptjs';
import { creado, fallo, pendiente } from '../utils/respuesta.js';
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

// POST /api/auth/login — día 2
// Si el DNI no existe o la contraseña no coincide → 401 CREDENCIALES_INVALIDAS (mismo mensaje en ambos casos)
// token = jwt.sign({ id_usuario, dni, nombres, rol }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRA })
// Responder ok(res, { token, usuario: { id_usuario, dni, nombres, rol } })
export async function login(req, res) {
  return pendiente(res);
}

// GET /api/auth/perfil — día 2  → datos de req.usuario.id_usuario
export async function perfil(req, res) {
  return pendiente(res);
}
