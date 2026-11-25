// Carga datos de prueba: npm run seed
// Deja la BD lista en segundos: borra los datos y vuelve a crear usuarios, inmuebles con fotos
// y un historial de consultas.
// Requisito: haber importado server/database/schema.sql (la BD inmo_predict debe existir).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { DESCRIPCIONES, INMUEBLES, PREDICCIONES_ANA, USUARIOS } from './datos-prueba.js';

const VERSION_MODELO = '1.0.0';
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const haceDias = (dias) => new Date(Date.now() - dias * MILISEGUNDOS_POR_DIA);

// Fórmula sin ruido de la sección 6.1 del plan, expresada en USD completos
const FACTOR_ZONA = { centro: 1.0, suburbio: 1.05, rural: 0.83 };
const estimarPrecio = ({ superficie_m2, num_habitaciones, zona, anio_construccion }) =>
  Math.round(
    2200 * superficie_m2 * FACTOR_ZONA[zona] +
      8000 * num_habitaciones +
      2000 * (anio_construccion - 2000),
  );

// El orden importa por las llaves foráneas. Va antes de la transacción:
// ALTER TABLE confirma la transacción por sí solo.
async function vaciarTablas(conexion) {
  for (const tabla of ['fotos_inmueble', 'predicciones', 'inmuebles', 'usuarios']) {
    await conexion.query(`DELETE FROM ${tabla}`);
    await conexion.query(`ALTER TABLE ${tabla} AUTO_INCREMENT = 1`);
  }
}

// Devuelve los ids de los propietarios, en el orden de USUARIOS
async function crearUsuarios(conexion) {
  const idsPropietarios = [];
  for (const u of USUARIOS) {
    const password_hash = await bcrypt.hash(u.password, 10);
    const [resultado] = await conexion.execute(
      `INSERT INTO usuarios (dni, nombres, apellidos, telefono, email, password_hash, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.dni, u.nombres, u.apellidos, u.telefono, u.email, password_hash, u.rol],
    );
    if (u.rol === 'propietario') idsPropietarios.push(resultado.insertId);
  }
  return idsPropietarios;
}

async function insertarInmueble(conexion, id_usuario, inmueble, fecha_publicacion) {
  const precio_estimado_usd = estimarPrecio(inmueble);
  const precio_venta_usd = Math.round((precio_estimado_usd * (1 + inmueble.variacion)) / 500) * 500;
  const [resultado] = await conexion.execute(
    `INSERT INTO inmuebles
       (id_usuario, titulo, descripcion, tipo_inmueble, zona, region, provincia, distrito,
        superficie_m2, num_habitaciones, anio_construccion, precio_estimado_usd,
        precio_venta_usd, version_modelo, estado, fecha_publicacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_usuario,
      inmueble.titulo,
      DESCRIPCIONES[inmueble.tipo_inmueble],
      inmueble.tipo_inmueble,
      inmueble.zona,
      inmueble.region,
      inmueble.provincia,
      inmueble.distrito,
      inmueble.superficie_m2,
      inmueble.num_habitaciones,
      inmueble.anio_construccion,
      precio_estimado_usd,
      precio_venta_usd,
      VERSION_MODELO,
      inmueble.estado,
      fecha_publicacion,
    ],
  );
  return resultado.insertId;
}

// Devuelve cuántas fotos se guardaron
async function crearInmuebles(conexion, idsPropietarios) {
  let totalFotos = 0;

  for (const [i, inmueble] of INMUEBLES.entries()) {
    const id_usuario = idsPropietarios[i % idsPropietarios.length];
    const id_inmueble = await insertarInmueble(conexion, id_usuario, inmueble, haceDias(i + 1));

    for (const [indice, foto] of inmueble.fotos.entries()) {
      await conexion.execute(
        'INSERT INTO fotos_inmueble (id_inmueble, ruta, orden) VALUES (?, ?, ?)',
        [id_inmueble, `/assets/img/seed/${foto}.jpg`, indice + 1],
      );
    }
    totalFotos += inmueble.fotos.length;
  }
  return totalFotos;
}

async function crearPredicciones(conexion, id_usuario) {
  for (const consulta of PREDICCIONES_ANA) {
    await conexion.execute(
      `INSERT INTO predicciones (id_usuario, superficie_m2, num_habitaciones, zona,
                                 anio_construccion, precio_estimado_usd, version_modelo,
                                 fecha_prediccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        consulta.superficie_m2,
        consulta.num_habitaciones,
        consulta.zona,
        consulta.anio_construccion,
        estimarPrecio(consulta),
        VERSION_MODELO,
        haceDias(consulta.hace_dias),
      ],
    );
  }
}

function explicarError(err) {
  if (err.code === 'ER_BAD_DB_ERROR') {
    return 'No existe la base inmo_predict. Primero importa server/database/schema.sql en phpMyAdmin.';
  }
  if (err.code === 'ECONNREFUSED') {
    return 'No hay conexión con la base de datos. ¿Está encendido "MySQL" en el panel de XAMPP?';
  }
  return `Error al cargar los datos: ${err.message}`;
}

async function main() {
  let conexion;
  try {
    conexion = await pool.getConnection();
    await vaciarTablas(conexion);

    await conexion.beginTransaction();
    const idsPropietarios = await crearUsuarios(conexion);
    const totalFotos = await crearInmuebles(conexion, idsPropietarios);
    await crearPredicciones(conexion, idsPropietarios[0]); // el primer propietario es Ana
    await conexion.commit();

    console.log('✔ Datos de prueba cargados');
    console.log(
      `  ${USUARIOS.length} usuarios · ${INMUEBLES.length} inmuebles · ${totalFotos} fotos · ` +
        `${PREDICCIONES_ANA.length} predicciones\n`,
    );
    console.table(USUARIOS.map(({ dni, nombres, rol, password }) => ({ dni, nombres, rol, password })));
  } catch (err) {
    await conexion?.rollback();
    console.error(`✖ ${explicarError(err)}`);
    process.exitCode = 1;
  } finally {
    conexion?.release();
    await pool.end();
  }
}

main();
