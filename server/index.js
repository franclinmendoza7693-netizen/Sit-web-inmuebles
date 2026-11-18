// Punto de entrada: carga la configuración (.env) y arranca el servidor
import 'dotenv/config';
import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`InmoPredict corriendo en http://localhost:${PORT}`);
});
