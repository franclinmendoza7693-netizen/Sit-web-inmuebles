// Acceso a la tabla usuarios — dueño: Dev A
// Solo consultas parametrizadas con pool.execute(sql, [valores]).
import { pool } from '../config/db.js';

// Columnas que se pueden mostrar: NUNCA incluir password_hash aquí
const COLUMNAS_PUBLICAS = 'id_usuario, dni, nombres, apellidos, telefono, email, rol, fecha_registro';

// Para el login: es la única función que devuelve password_hash
export async function buscarPorDni(dni) {
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE dni = ?`,
    [dni],
  );
  return filas[0] ?? null;
}

export async function buscarPorId(id_usuario) {
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id_usuario = ?`,
    [id_usuario],
  );
  return filas[0] ?? null;
}

export async function existeDni(dni) {
  const [filas] = await pool.execute('SELECT 1 FROM usuarios WHERE dni = ? LIMIT 1', [dni]);
  return filas.length > 0;
}

// Devuelve el usuario creado (sin password_hash)
export async function crear({ dni, nombres, apellidos, telefono, email, password_hash, rol = 'propietario' }) {
  const [resultado] = await pool.execute(
    `INSERT INTO usuarios (dni, nombres, apellidos, telefono, email, password_hash, rol)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dni, nombres, apellidos, telefono || null, email || null, password_hash, rol],
  );
  return buscarPorId(resultado.insertId);
}
