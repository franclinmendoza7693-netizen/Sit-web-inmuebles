// Punto de entrada: carga la configuración (.env) y arranca el servidor
import 'dotenv/config';
import app from './app.js';
import { PUERTO } from './config/puerto.js';

app.listen(PUERTO, () => {
  console.log(`InmoPredict corriendo en http://localhost:${PUERTO}`);
});
