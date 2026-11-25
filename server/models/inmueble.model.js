// Acceso a las tablas inmuebles y fotos_inmueble: solo consultas parametrizadas con pool.execute
import { pool } from '../config/db.js';

// El ORDER BY sale de este objeto fijo: nunca se arma con el texto que manda el usuario.
// Las llaves son los valores de ORDENES del contrato; el id desempata y estabiliza la paginación.
const ORDEN_SQL = {
  recientes: 'i.fecha_publicacion DESC, i.id_inmueble DESC',
  precio_asc: 'i.precio_venta_usd ASC, i.id_inmueble ASC',
  precio_desc: 'i.precio_venta_usd DESC, i.id_inmueble DESC',
};
export const ORDEN_POR_DEFECTO = 'recientes';

// Columnas de cada item de un listado; foto_principal es la foto de orden 1, o null
const COLUMNAS_LISTADO = `i.id_inmueble, i.titulo, i.tipo_inmueble, i.zona, i.region, i.provincia,
  i.distrito, i.superficie_m2, i.num_habitaciones, i.anio_construccion, i.precio_venta_usd,
  i.precio_estimado_usd, i.estado,
  (SELECT f.ruta FROM fotos_inmueble f
    WHERE f.id_inmueble = i.id_inmueble AND f.orden = 1 LIMIT 1) AS foto_principal,
  i.fecha_publicacion`;

// En LIKE, "%" y "_" son comodines: se escapan para que el distrito se busque tal cual se escribió
const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&');

// Solo los inmuebles publicados son visibles para el público
function construirFiltros({ tipo_inmueble, zona, distrito, precio_min, precio_max }) {
  const condiciones = ["i.estado = 'publicado'"];
  const valores = [];

  if (tipo_inmueble) {
    condiciones.push('i.tipo_inmueble = ?');
    valores.push(tipo_inmueble);
  }
  if (zona) {
    condiciones.push('i.zona = ?');
    valores.push(zona);
  }
  if (distrito) {
    condiciones.push('i.distrito LIKE ?');
    valores.push(`%${escaparLike(distrito)}%`);
  }
  if (precio_min !== undefined) {
    condiciones.push('i.precio_venta_usd >= ?');
    valores.push(precio_min);
  }
  if (precio_max !== undefined) {
    condiciones.push('i.precio_venta_usd <= ?');
    valores.push(precio_max);
  }
  return { donde: condiciones.join(' AND '), valores };
}

export async function listarPublicados({ filtros, orden, pagina, porPagina }) {
  const { donde, valores } = construirFiltros(filtros);

  const [items] = await pool.execute(
    `SELECT ${COLUMNAS_LISTADO}
       FROM inmuebles i
      WHERE ${donde}
      ORDER BY ${ORDEN_SQL[orden]}
      LIMIT ? OFFSET ?`,
    [...valores, porPagina, (pagina - 1) * porPagina],
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM inmuebles i WHERE ${donde}`,
    valores,
  );
  return { items, total };
}

// Todos los inmuebles del dueño, en cualquier estado, del más reciente al más antiguo
export async function listarPorUsuario(id_usuario) {
  const [items] = await pool.execute(
    `SELECT ${COLUMNAS_LISTADO}
       FROM inmuebles i
      WHERE i.id_usuario = ?
      ORDER BY ${ORDEN_SQL.recientes}`,
    [id_usuario],
  );
  return items;
}

// Devuelve el id_usuario del dueño, o null si el inmueble no existe
export async function buscarDueno(id_inmueble) {
  const [filas] = await pool.execute('SELECT id_usuario FROM inmuebles WHERE id_inmueble = ?', [
    id_inmueble,
  ]);
  return filas[0]?.id_usuario ?? null;
}

export async function actualizarEstado(id_inmueble, estado) {
  await pool.execute('UPDATE inmuebles SET estado = ? WHERE id_inmueble = ?', [
    estado,
    id_inmueble,
  ]);
}

// Guarda el inmueble y sus fotos en una sola transacción: se guardan las dos cosas o ninguna.
// Devuelve el id del inmueble creado. rutasFotos va en orden: la primera es la foto principal.
export async function crear(datos, rutasFotos) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.execute(
      `INSERT INTO inmuebles (id_usuario, titulo, descripcion, tipo_inmueble, zona, region,
                              provincia, distrito, direccion, superficie_m2, num_habitaciones,
                              anio_construccion, precio_estimado_usd, precio_venta_usd,
                              version_modelo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id_usuario,
        datos.titulo,
        datos.descripcion ?? null,
        datos.tipo_inmueble,
        datos.zona,
        datos.region,
        datos.provincia,
        datos.distrito,
        datos.direccion ?? null,
        datos.superficie_m2,
        datos.num_habitaciones,
        datos.anio_construccion,
        datos.precio_estimado_usd ?? null,
        datos.precio_venta_usd,
        datos.version_modelo ?? null,
      ],
    );
    const id_inmueble = resultado.insertId;

    for (const [indice, ruta] of rutasFotos.entries()) {
      await conexion.execute(
        'INSERT INTO fotos_inmueble (id_inmueble, ruta, orden) VALUES (?, ?, ?)',
        [id_inmueble, ruta, indice + 1],
      );
    }
    await conexion.commit();
    return id_inmueble;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

// Devuelve el inmueble publicado con sus fotos y el contacto del dueño, o null si no existe.
// Del dueño solo salen nombres y teléfono: nunca dni, email ni password_hash.
export async function buscarPublicadoPorId(id_inmueble) {
  const [filas] = await pool.execute(
    `SELECT i.id_inmueble, i.titulo, i.descripcion, i.tipo_inmueble, i.zona, i.region, i.provincia,
            i.distrito, i.direccion, i.superficie_m2, i.num_habitaciones, i.anio_construccion,
            i.precio_venta_usd, i.precio_estimado_usd, i.version_modelo, i.estado,
            i.fecha_publicacion, u.nombres AS contacto_nombres, u.telefono AS contacto_telefono
       FROM inmuebles i
       JOIN usuarios u ON u.id_usuario = i.id_usuario
      WHERE i.id_inmueble = ? AND i.estado = 'publicado'`,
    [id_inmueble],
  );
  if (!filas[0]) return null;

  const [fotos] = await pool.execute(
    'SELECT ruta, orden FROM fotos_inmueble WHERE id_inmueble = ? ORDER BY orden',
    [id_inmueble],
  );
  const { contacto_nombres, contacto_telefono, ...inmueble } = filas[0];
  return {
    ...inmueble,
    fotos,
    contacto: { nombres: contacto_nombres, telefono: contacto_telefono },
  };
}
