// Acceso a la tabla predicciones: solo consultas parametrizadas con pool.execute
import { pool } from '../config/db.js';

// Devuelve el id de la consulta guardada
export async function crear(datos) {
  const [resultado] = await pool.execute(
    `INSERT INTO predicciones (id_usuario, superficie_m2, num_habitaciones, zona,
                               anio_construccion, precio_estimado_usd, version_modelo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.id_usuario,
      datos.superficie_m2,
      datos.num_habitaciones,
      datos.zona,
      datos.anio_construccion,
      datos.precio_estimado_usd,
      datos.version_modelo,
    ],
  );
  return resultado.insertId;
}

// Solo las consultas del usuario indicado, las más recientes primero
export async function listarPorUsuario(id_usuario) {
  const [filas] = await pool.execute(
    `SELECT id_prediccion, superficie_m2, num_habitaciones, zona, anio_construccion,
            precio_estimado_usd, version_modelo, fecha_prediccion
       FROM predicciones
      WHERE id_usuario = ?
      ORDER BY fecha_prediccion DESC, id_prediccion DESC`,
    [id_usuario],
  );
  return filas;
}
