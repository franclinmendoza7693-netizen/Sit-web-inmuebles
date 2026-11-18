// Carga datos de prueba: npm run seed
// Deja la BD lista en segundos: borra los datos y vuelve a crear usuarios e inmuebles de prueba.
// Requisito: haber importado server/database/schema.sql (la BD inmo_predict debe existir).
//
// TODO: ampliar a ~24 inmuebles con fotos de client/assets/img/seed/ (WebP ≤ 200 KB).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

// SOLO contraseñas de prueba (el repo es público). Se listan también en el README.
const USUARIOS = [
  { dni: '00000001', nombres: 'Admin', apellidos: 'InmoPredict', telefono: '900000001', email: null, password: 'Admin1234', rol: 'admin' },
  { dni: '11111111', nombres: 'Ana', apellidos: 'Torres Vega', telefono: '911111111', email: 'ana@prueba.pe', password: 'Prueba123', rol: 'propietario' },
  { dni: '22222222', nombres: 'Luis', apellidos: 'Ramírez Soto', telefono: '922222222', email: 'luis@prueba.pe', password: 'Prueba123', rol: 'propietario' },
  { dni: '33333333', nombres: 'María', apellidos: 'Quispe Rojas', telefono: '933333333', email: null, password: 'Prueba123', rol: 'propietario' },
];

const INMUEBLES = [
  { titulo: 'Departamento con vista al parque', tipo_inmueble: 'departamento', zona: 'centro', region: 'La Libertad', provincia: 'Trujillo', distrito: 'Víctor Larco Herrera', superficie_m2: 120, num_habitaciones: 3, anio_construccion: 2008, precio_estimado_usd: 304000, precio_venta_usd: 316000, estado: 'publicado', fecha_publicacion: '2026-11-12T15:30:00.000Z' },
  { titulo: 'Casa amplia con jardín', tipo_inmueble: 'casa', zona: 'suburbio', region: 'La Libertad', provincia: 'Trujillo', distrito: 'Huanchaco', superficie_m2: 180, num_habitaciones: 5, anio_construccion: 2015, precio_estimado_usd: 486000, precio_venta_usd: 476000, estado: 'publicado', fecha_publicacion: '2026-11-11T15:30:00.000Z' },
  { titulo: 'Departamento flat cerca al óvalo', tipo_inmueble: 'departamento', zona: 'centro', region: 'Lima', provincia: 'Lima', distrito: 'Miraflores', superficie_m2: 110, num_habitaciones: 3, anio_construccion: 2012, precio_estimado_usd: 290000, precio_venta_usd: 319000, estado: 'publicado', fecha_publicacion: '2026-11-10T15:30:00.000Z' },
  { titulo: 'Casa de dos pisos para familia', tipo_inmueble: 'casa', zona: 'suburbio', region: 'Lima', provincia: 'Lima', distrito: 'La Molina', superficie_m2: 220, num_habitaciones: 5, anio_construccion: 2005, precio_estimado_usd: 558000, precio_venta_usd: 569000, estado: 'publicado', fecha_publicacion: '2026-11-09T15:30:00.000Z' },
  { titulo: 'Casa de campo con huerto', tipo_inmueble: 'casa', zona: 'rural', region: 'Arequipa', provincia: 'Arequipa', distrito: 'Sabandía', superficie_m2: 90, num_habitaciones: 2, anio_construccion: 2000, precio_estimado_usd: 180500, precio_venta_usd: 171000, estado: 'publicado', fecha_publicacion: '2026-11-08T15:30:00.000Z' },
  { titulo: 'Departamento estreno', tipo_inmueble: 'departamento', zona: 'centro', region: 'Arequipa', provincia: 'Arequipa', distrito: 'Yanahuara', superficie_m2: 85, num_habitaciones: 2, anio_construccion: 2024, precio_estimado_usd: 251000, precio_venta_usd: 266000, estado: 'publicado', fecha_publicacion: '2026-11-07T15:30:00.000Z' },
  { titulo: 'Casa esquinera remodelada', tipo_inmueble: 'casa', zona: 'centro', region: 'La Libertad', provincia: 'Trujillo', distrito: 'Trujillo', superficie_m2: 150, num_habitaciones: 4, anio_construccion: 1990, precio_estimado_usd: 342000, precio_venta_usd: 332000, estado: 'publicado', fecha_publicacion: '2026-11-06T15:30:00.000Z' },
  { titulo: 'Casa rústica cerca al valle', tipo_inmueble: 'casa', zona: 'rural', region: 'Lima', provincia: 'Huaral', distrito: 'Huaral', superficie_m2: 130, num_habitaciones: 3, anio_construccion: 1998, precio_estimado_usd: 257500, precio_venta_usd: 258000, estado: 'publicado', fecha_publicacion: '2026-11-05T15:30:00.000Z' },
];

const DESCRIPCIONES = {
  casa: 'Casa iluminada, con sala comedor amplia, cocina equipada y patio. Lista para mudarse.',
  departamento: 'Departamento con buena distribución, ventanas al exterior y acceso a áreas comunes.',
};

async function main() {
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
    for (const [i, m] of INMUEBLES.entries()) {
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
    console.log(`  ${USUARIOS.length} usuarios · ${INMUEBLES.length} inmuebles\n`);
    console.table(USUARIOS.map(({ dni, nombres, rol, password }) => ({ dni, nombres, rol, password })));
  } catch (err) {
    await conexion?.rollback();
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('✖ No existe la base inmo_predict. Primero importa server/database/schema.sql en phpMyAdmin.');
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
