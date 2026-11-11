import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar } from '../controllers/productos.js';
import { validarProducto } from '../middleware/validar-producto.js';
import { validarId } from '../middleware/solicitud.js';
import { exigirSesion } from '../middleware/autenticacion.js';

const router = Router();

router.get('/', listar);
router.post('/', exigirSesion, validarProducto, crear);
router.get('/:id', validarId, obtener);
router.put('/:id', exigirSesion, validarId, validarProducto, actualizar);
router.delete('/:id', exigirSesion, validarId, eliminar);

export default router;
