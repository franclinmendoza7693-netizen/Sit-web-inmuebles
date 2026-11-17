// Carga datos de prueba: npm run seed — dueño: Dev A
// Deja la BD lista en segundos: borra los datos y vuelve a crear usuarios e inmuebles de prueba.
// Requisito: haber importado database/schema.sql (la BD inmo_predict debe existir).
//
// Día 1: usuarios + los inmuebles de public/mocks/inmuebles.json (sin fotos).
// Día 4: ampliar a ~24 inmuebles con fotos de public/img/seed/ (WebP ≤ 200 KB).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// SOLO contraseñas de prueba (el repo es público). Se listan también en el README.
const USUARIOS = [
  { dni: '00000001', nombres: 'Admin', apellidos: 'InmoPredict', telefono: '900000001', email: null, password: 'Admin1234', rol: 'admin' },
  { dni: '11111111', nombres: 'Ana', apellidos: 'Torres Vega', telefono: '911111111', email: 'ana@prueba.pe', password: 'Prueba123', rol: 'propietario' },
  { dni: '22222222', nombres: 'Luis', apellidos: 'Ramírez Soto', telefono: '922222222', email: 'luis@prueba.pe', password: 'Prueba123', rol: 'propietario' },
  { dni: '33333333', nombres: 'María', apellidos: 'Quispe Rojas', telefono: '933333333', email: null, password: 'Prueba123', rol: 'propietario' },
];

const DESCRIPCIONES = {
  casa: 'Casa iluminada, con sala comedor amplia, cocina equipada y patio. Lista para mudarse.',
  departamento: 'Departamento con buena distribución, ventanas al exterior y acceso a áreas comunes.',
};

async function main() {
  const inmuebles = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/mocks/inmuebles.json'), 'utf8'));
  let conexion;

  try {
    conexion = await pool.getConnection();

    // 1. Vaciar tablas (el orden importa por las llaves foráneas).
    //    Va antes de la transacción: ALTER TABLE confirma la transacción por sí solo.
    for (const tabla of ['fotos_inmueble', 'predicciones', 'inmuebles', 'usuarios']) {
      await conexion.query(`DELETE FROM ${tabla}`);
      await conexion.query(`ALTER TABLE ${tabla} AUTO_INCREMENT = 1`);
    }

    await conexion.beginTransaction();

    // 2. Usuarios
    const idsPropietarios = [];
    for (const u of USUARIOS) {
      const password_hash = await bcrypt.hash(u.password, 10);
      const [r] = await conexion.execute(
        `INSERT INTO usuarios (dni, nombres, apellidos, telefono, email, password_hash, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.dni, u.nombres, u.apellidos, u.telefono, u.email, password_hash, u.rol],
      );
      if (u.rol === 'propietario') idsPropietarios.push(r.insertId);
    }

    // 3. Inmuebles (repartidos entre los propietarios)
    for (const [i, m] of inmuebles.entries()) {
      await conexion.execute(
        `INSERT INTO inmuebles
          (id_usuario, titulo, descripcion, tipo_inmueble, zona, region, provincia, distrito, direccion,
           superficie_m2, num_habitaciones, anio_construccion, precio_estimado_usd, precio_venta_usd,
           version_modelo, estado, fecha_publicacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idsPropietarios.at(i % idsPropietarios.length),
          m.titulo,
          DESCRIPCIONES[m.tipo_inmueble],
          m.tipo_inmueble,
          m.zona,
          m.region,
          m.provincia,
          m.distrito,
          null,
          m.superficie_m2,
          m.num_habitaciones,
          m.anio_construccion,
          m.precio_estimado_usd,
          m.precio_venta_usd,
          'mock',
          m.estado,
          new Date(m.fecha_publicacion),
        ],
      );
    }

    await conexion.commit();

    console.log('✔ Datos de prueba cargados');
    console.log(`  ${USUARIOS.length} usuarios · ${inmuebles.length} inmuebles\n`);
    console.table(USUARIOS.map(({ dni, nombres, rol, password }) => ({ dni, nombres, rol, password })));
  } catch (err) {
    await conexion?.rollback();
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('✖ No existe la base inmo_predict. Primero importa database/schema.sql en phpMyAdmin.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('✖ No hay conexión con la base de datos. ¿Está encendido "MySQL" en el panel de XAMPP?');
    } else {
      console.error('✖ Error al cargar los datos:', err.message);
    }
    process.exitCode = 1;
  } finally {
    conexion?.release();
    await pool.end();
  }
}

main();
