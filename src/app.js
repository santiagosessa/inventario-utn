import express from 'express';
import { fileURLToPath } from 'node:url';
import productos from './routes/productos.js';
import proveedores from './routes/proveedores.js';
import autenticacion from './routes/autenticacion.js';
import { errorHttp, manejarError } from './middleware/errores.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get(['/', '/api'], (_req, res) => {
  res.json({
    mensaje: 'API de inventario',
    productos: '/api/productos',
    proveedores: '/api/proveedores',
    autenticacion: '/api/auth',
    vista: '/inventario/',
  });
});
app.use('/api/auth', autenticacion);
app.use('/api/productos', productos);
app.use('/api/proveedores', proveedores);
app.use('/inventario', express.static(fileURLToPath(new URL('../dist/', import.meta.url))));
app.use((_req, _res, next) => next(errorHttp(404, 'La ruta solicitada no existe.')));
app.use(manejarError);

export default app;
