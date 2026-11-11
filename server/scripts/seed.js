// Carga datos de prueba: npm run seed — dueño: Dev A (días 1 y 4)
// Deja la BD lista para la demo en segundos.
//
// Pasos sugeridos:
// 1. Vaciar tablas en orden: fotos_inmueble, predicciones, inmuebles, usuarios.
// 2. Crear usuarios con bcrypt.hash():
//      admin       DNI 00000001   rol 'admin'
//      3 propietarios de prueba   rol 'propietario'
// 3. Insertar ~24 inmuebles (puede leer public/mocks/inmuebles.json como base)
//    con fotos de public/img/seed/ (WebP ≤ 200 KB).
// 4. Cerrar el pool: await pool.end()
//
// Las contraseñas de prueba van en el README, nunca contraseñas reales.
import 'dotenv/config';
import { pool } from '../config/db.js';

console.log('TODO (Dev A): implementar seed.js');
await pool.end();
