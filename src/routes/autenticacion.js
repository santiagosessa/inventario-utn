import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ingresar, obtenerSesion, registrar } from '../controllers/autenticacion.js';
import { exigirSesion } from '../middleware/autenticacion.js';

const router = Router();
const limitarIntentos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Volvé a intentar más tarde.' },
});

router.post('/registro', limitarIntentos, registrar);
router.post('/login', limitarIntentos, ingresar);
router.get('/sesion', exigirSesion, obtenerSesion);

export default router;
