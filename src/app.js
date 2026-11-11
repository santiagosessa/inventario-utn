import express from 'express';
import { fileURLToPath } from 'node:url';
import productos from './routes/productos.js';
import { errorHttp, manejarError } from './middleware/errores.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get(['/', '/api'], (_req, res) => {
  res.json({ mensaje: 'API de inventario', productos: '/api/productos', vista: '/inventario/' });
});
app.use('/api/productos', productos);
app.use('/inventario', express.static(fileURLToPath(new URL('../dist/', import.meta.url))));
app.use((_req, _res, next) => next(errorHttp(404, 'La ruta solicitada no existe.')));
app.use(manejarError);

export default app;
