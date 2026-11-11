import { once } from 'node:events';
import mongoose from 'mongoose';
import app from './src/app.js';
import Usuario from './src/models/usuario.js';

const { MONGODB_URI, HOST = '127.0.0.1', PORT = '3000' } = process.env;
const puerto = Number(PORT);

async function iniciar() {
  if (!MONGODB_URI) throw new Error('Configurá MONGODB_URI en el archivo .env.');
  if (Buffer.byteLength(process.env.JWT_SECRET ?? '') < 32) {
    throw new Error('Configurá JWT_SECRET en .env con al menos 32 bytes aleatorios.');
  }
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error('PORT debe ser un número entero entre 1 y 65535.');
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await Usuario.init();
  } catch {
    throw new Error('No se pudo conectar con MongoDB. Revisá el servicio y MONGODB_URI.');
  }
  console.log('Conexión con MongoDB establecida.');

  const servidor = app.listen(puerto, HOST);
  await once(servidor, 'listening');
  console.log(`Inventario disponible en http://${HOST}:${puerto}`);
}

iniciar().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
  await mongoose.disconnect();
});
