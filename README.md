# InmoPredict — Predicción de precios de venta de inmuebles

Caso propuesto 01: plataforma web donde el propietario se registra con su DNI, obtiene una estimación del precio de su inmueble con una red neuronal (TensorFlow.js, ejecutada en el navegador) y lo publica en un catálogo público para clientes.

**Stack:** Node.js + Express (MVC) · MariaDB de XAMPP (compatible con MySQL) · HTML, CSS y JavaScript + Bootstrap 5 · TensorFlow.js

## Equipo

| Rol | Integrante | Carpetas que le pertenecen |
| --- | --- | --- |
| Dev A — Backend y BD | _(nombre)_ | `server/`, `database/`, archivos de configuración de la raíz |
| Dev B — ML e integración del modelo | _(nombre)_ | `ml/`, `public/js/modelo/`, `public/modelo/`, `public/admin/`, `predecir.js`, `publicar.js`, `entrenamiento.js` |
| Dev C — Frontend y UX | _(nombre)_ | `public/*.html`, `public/css/`, el resto de `public/js/` |
| Los 3 (solo por PR `contrato:`) | — | `shared/contrato.js` |

Cada uno edita solo sus carpetas. Si necesitas un cambio en un archivo ajeno, pídelo o abre un PR que revise su dueño.

## Requisitos

- Node.js LTS (la misma versión en las 3 PCs; ver `.nvmrc`)
- **XAMPP** (los 3 con XAMPP, para tener el mismo motor de BD). Se usa el módulo **MySQL** (que en XAMPP es MariaDB). **Apache** solo se enciende para abrir phpMyAdmin: el proyecto no usa PHP, su servidor es Node en el puerto 3000.
- Git + GitKraken, VS Code

## Instalación (primera vez)

```bash
# 1. Clonar el repo (desde GitKraken) y entrar a la carpeta
npm install

# 2. Variables de entorno
cp .env.example .env          # Windows: copy .env.example .env
#    → cambiar JWT_SECRET. DB_PASSWORD queda vacío con el root de XAMPP.

# 3. Crear la base de datos
#    Panel de XAMPP → Start en "MySQL" (y en "Apache" solo para usar phpMyAdmin)
#    http://localhost/phpmyadmin → pestaña "Importar" (sin elegir base a la izquierda)
#    → archivo database/schema.sql → "Importar"

# 4. Datos de prueba (usuarios e inmuebles; ver "Usuarios de prueba")
npm run seed

# 5. Levantar el servidor
npm run dev
```

Abrir **http://localhost:3000** (nunca abrir los HTML con doble clic: el modelo y la API no cargan desde `file://`).
Prueba rápida: **http://localhost:3000/api/salud** debe responder `"estado": "ok"` y `"bd": "conectada"`.
Si dice `"sin conexión"`: revisa que "MySQL" esté en verde en el panel de XAMPP, que el puerto sea 3306 y la contraseña de `.env`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm start` | Servidor sin recarga |
| `npm run seed` | Carga usuarios e inmuebles de prueba |
| `npm run dataset` | Regenera `public/admin/datos/inmuebles.csv` (2 000 filas, semilla fija) |

## Estructura

```text
inmo-predict/
├── shared/contrato.js            ← ÚNICA fuente de nombres, valores y límites (front y back)
├── server/                       ← API REST con Express
│   ├── app.js                    ← arranque, estáticos, rutas, errores
│   ├── config/db.js              ← pool MariaDB/MySQL (decimalNumbers: true)
│   ├── routes/                   ← URL → controlador
│   ├── controllers/              ← lógica de cada endpoint
│   ├── models/                   ← consultas SQL parametrizadas
│   ├── middlewares/              ← auth JWT, validación, subida de fotos, errores
│   ├── scripts/seed.js
│   └── utils/respuesta.js        ← sobre { ok, data, mensaje } / { ok, error }
├── database/schema.sql · migraciones/
├── ml/generar-dataset.js         ← dataset sintético calibrado con el enunciado
├── public/                       ← lo que ve el navegador
│   ├── index.html                ← catálogo público
│   ├── detalle.html · login.html · registro.html
│   ├── predecir.html · publicar.html · panel.html
│   ├── admin/entrenamiento.html  ← entrenar y exportar el modelo (solo admin)
│   ├── admin/datos/inmuebles.csv
│   ├── css/variables.css · estilos.css
│   ├── js/config.js · api.js · auth.js
│   ├── js/utils/ · componentes/ · paginas/
│   ├── js/modelo/prediccion.js   ← predecirPrecio() (hoy simulada, día 3 real)
│   ├── modelo/                   ← modelo_inmuebles.json + .weights.bin + normalizacion.json
│   ├── mocks/inmuebles.json      ← datos falsos con la forma exacta de la API
│   └── img/
├── uploads/                      ← fotos subidas (fuera de Git)
└── docs/                         ← Postman, diagrama de BD, informe del modelo, manual
```

## Reglas de oro

1. **Un dato se llama igual en todas partes:** `name` del input = campo JSON = columna MySQL (`superficie_m2`, `num_habitaciones`, `zona`, `anio_construccion`…).
2. **snake_case** para BD, JSON y `name`; **camelCase** para variables y funciones JS; **UPPER_SNAKE_CASE** para constantes.
3. **Dinero siempre en USD completos.** El modelo trabaja en miles; el `×1000` vive solo en `prediccion.js`. Los soles se calculan en pantalla.
4. **Valores cerrados en minúsculas y sin tildes:** `centro | suburbio | rural`, `casa | departamento`, `publicado | pausado | vendido`.
5. **Toda llamada a la API pasa por `api()`** de `public/js/api.js`.
6. **Las dependencias npm solo las agrega Dev A** (evita conflictos en `package-lock.json`).

## Flujo de Git

```text
main        ← solo entregas (v0.9.0 día 4, v1.0.0 día 6); solo Dev A pasa developer → main
developer   ← integración diaria (rama por defecto)
developF    ← Dev A · Backend y BD
developM    ← Dev B · Machine Learning
developR    ← Dev C · Frontend y UX
```

1. **Al empezar el día:** checkout `developer` → Pull; checkout de tu rama → clic derecho sobre `developer` → *Merge developer into …* → Push.
2. **Durante el día:** commits pequeños en tu rama: `feat(auth): agrega registro con DNI`, `fix(catalogo): corrige filtro de precio`.
3. **Al final del día:** Push y Pull Request de tu rama → `developer`, con `Closes #<issue>`; lo revisa otro integrante.
4. Merge con **Create a merge commit** (no squash), para que cada commit conserve a su autor.

Nunca: commit directo a `main`/`developer`, force push en ramas compartidas, subir `.env`, `node_modules/` o `uploads/`.

## Usuarios de prueba

Se crean con `npm run seed` (borra y recarga los datos de prueba). Son solo para desarrollo: el repo es público.

| Rol | DNI | Contraseña | Nombre |
| --- | --- | --- | --- |
| admin | 00000001 | Admin1234 | Admin InmoPredict |
| propietario | 11111111 | Prueba123 | Ana Torres Vega |
| propietario | 22222222 | Prueba123 | Luis Ramírez Soto |
| propietario | 33333333 | Prueba123 | María Quispe Rojas |
