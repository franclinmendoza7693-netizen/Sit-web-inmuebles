// Pool de conexiones a MariaDB (XAMPP) / MySQL — dueño: Dev A
// mysql2 funciona igual con ambos motores.
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inmo_predict',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // sin esto, los DECIMAL llegan como texto ("320000.00")
  dateStrings: false,
});

// Siempre consultas parametrizadas:  pool.execute('SELECT … WHERE dni = ?', [dni])
// Nunca concatenar valores del usuario dentro del SQL.
// DNI duplicado: el error llega con err.code === 'ER_DUP_ENTRY' → responder 409 DNI_DUPLICADO.

export async function ping() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
