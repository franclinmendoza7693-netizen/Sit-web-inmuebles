# InmoPredict

Sistema web de predicción de precios de venta de inmuebles con redes neuronales.

El propietario se registra con su DNI, obtiene una estimación del precio de su inmueble con un modelo de TensorFlow.js que se ejecuta en el navegador y lo publica en un catálogo público para clientes.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend (`client/`) | HTML5, CSS3, JavaScript (ES Modules), Bootstrap 5 |
| Modelo | TensorFlow.js (red neuronal densa), tfjs-vis, Papa Parse |
| Backend (`server/`) | Node.js, Express 5 (MVC), JWT, bcryptjs, express-validator |
| Base de datos | MariaDB / MySQL (XAMPP) |

## Cómo funciona

- `client/` no instala nada: Bootstrap y TensorFlow.js llegan por CDN, por eso no tiene `package.json`.
- `server/` es la aplicación de Node: expone la API en `/api` y entrega los archivos de `client/`. Todo corre en un solo puerto (http://localhost:3000).
- `shared/contrato.js` define los nombres de los campos, los valores permitidos y los límites; lo importan el cliente y el servidor para que los datos se llamen igual en el formulario, en la API y en la base de datos.

## Requisitos

- Node.js 22 o superior
- XAMPP con el módulo **MySQL** encendido (Apache solo para abrir phpMyAdmin)

## Instalación

1. Entrar a la carpeta del servidor e instalar las dependencias:
   ```bash
   cd server
   npm install
   ```
2. Crear el archivo de configuración y completar `JWT_SECRET`:
   ```bash
   copy .env.example .env
   ```
3. Crear la base de datos: en phpMyAdmin, pestaña **Importar**, archivo `server/database/schema.sql`.
4. Cargar los datos de prueba:
   ```bash
   npm run seed
   ```
5. Iniciar el servidor y abrir http://localhost:3000:
   ```bash
   npm run dev
   ```

## Scripts

Se ejecutan dentro de `server/`.

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Servidor en modo normal |
| `npm run seed` | Carga usuarios e inmuebles de prueba |
| `npm run dataset` | Regenera el dataset de entrenamiento (`client/assets/data/inmuebles.csv`) |

## Estructura

```text
Sit-web-inmuebles/
├── client/                    frontend: lo que recibe el navegador (HTML, CSS y JS)
│   ├── *.html                 páginas: catálogo, detalle, login, registro, predecir, publicar, panel
│   ├── admin/                 entrenamiento del modelo (solo admin)
│   ├── assets/
│   │   ├── css/               variables.css (sistema visual) y estilos.css
│   │   ├── data/              inmuebles.csv (dataset de entrenamiento)
│   │   ├── img/               imágenes de la interfaz
│   │   └── model/             modelo exportado: JSON, pesos y normalización
│   ├── js/
│   │   ├── api.js · auth.js · config.js   conexión con la API, sesión y configuración
│   │   ├── components/        piezas reutilizables: navbar, tarjeta, ver contraseña
│   │   ├── ml/                predicción y preprocesamiento con TensorFlow.js
│   │   ├── pages/             un script por página
│   │   └── utils/             formatos y formularios
│   └── mocks/                 datos de ejemplo del catálogo (temporal: se elimina el día 3)
├── server/                    backend: API REST con Node.js y Express (MVC)
│   ├── index.js               arranca el servidor
│   ├── app.js                 configura Express: seguridad, archivos estáticos, rutas y errores
│   ├── config/                conexión a la base de datos
│   ├── routes/                URL → controlador
│   ├── controllers/           lógica de cada endpoint
│   ├── models/                consultas SQL parametrizadas
│   ├── middlewares/           autenticación, validación, subida de fotos y errores
│   ├── utils/                 formato único de respuesta
│   ├── database/              schema.sql (se importa en phpMyAdmin) y seed.js (datos de prueba)
│   ├── scripts/               generar-dataset.js (dataset sintético de entrenamiento)
│   ├── .env.example           plantilla de configuración (el .env real no se sube)
│   └── package.json           dependencias y comandos del servidor
├── shared/
│   └── contrato.js            nombres, valores y límites que usan client y server
├── .editorconfig · .prettierrc · .gitattributes   mismo formato de código en las 3 PCs
└── .gitignore · README.md
```

## API

Todas las respuestas tienen la forma `{ ok, data, mensaje }` o `{ ok: false, error: { codigo, mensaje, campos } }`.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/salud` | Público | Estado del servidor y de la base de datos |
| POST | `/api/auth/registro` | Público | Registro de propietario con DNI y contraseña |
| POST | `/api/auth/login` | Público | Inicio de sesión; devuelve un token JWT |
| GET | `/api/auth/perfil` | Token | Datos del usuario autenticado |
| GET | `/api/inmuebles` | Público | Catálogo de inmuebles publicados. Filtros opcionales: `tipo_inmueble`, `zona`, `distrito`, `precio_min`, `precio_max`; `orden` (`recientes`, `precio_asc`, `precio_desc`) y `pagina`. Devuelve `items`, `pagina`, `por_pagina` y `total` |
| GET | `/api/inmuebles/:id_inmueble` | Público | Detalle de un inmueble publicado, con sus fotos y el contacto del propietario |

## Usuarios de prueba

Se crean con `npm run seed`.

| Rol | DNI | Contraseña |
| --- | --- | --- |
| Administrador | 00000001 | Admin1234 |
| Propietario | 11111111 | Prueba123 |
| Propietario | 22222222 | Prueba123 |
| Propietario | 33333333 | Prueba123 |

## Equipo

| Integrante | Responsabilidad |
| --- | --- |
| _(nombre)_ | Backend y base de datos |
| _(nombre)_ | Modelo de Machine Learning |
| _(nombre)_ | Frontend y experiencia de usuario |
