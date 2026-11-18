// Configuración de Express: seguridad, archivos estáticos, rutas de la API y errores
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { ping } from './config/db.js';
import { ok } from './utils/respuesta.js';
import { noEncontrado, manejarErrores } from './middlewares/errores.js';
import authRoutes from './routes/auth.routes.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = path.join(RAIZ, 'server', 'uploads');
fs.mkdirSync(path.join(UPLOADS, 'inmuebles'), { recursive: true });

const app = express();

// ---------- Middlewares globales ----------
// TODO: activar una Content-Security-Policy que permita cdn.jsdelivr.net
// y probar TODAS las páginas (en especial admin/entrenamiento.html con tfjs-vis) antes de dejarla.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// ---------- Archivos estáticos ----------
app.use(express.static(path.join(RAIZ, 'client')));
app.use('/shared', express.static(path.join(RAIZ, 'shared')));
app.use('/uploads', express.static(UPLOADS));

// ---------- API ----------
app.get('/api/salud', async (req, res) => {
  ok(res, { estado: 'ok', bd: (await ping()) ? 'conectada' : 'sin conexión' });
});
app.use('/api/auth', authRoutes);

// ---------- Errores (siempre al final) ----------
app.use('/api', noEncontrado);
app.use(manejarErrores);

export default app;
