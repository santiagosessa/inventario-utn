import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar } from '../controllers/productos.js';
import { validarId, validarProducto } from '../middleware/validar-producto.js';

const router = Router();

router.get('/', listar);
router.post('/', validarProducto, crear);
router.get('/:id', validarId, obtener);
router.put('/:id', validarId, validarProducto, actualizar);
router.delete('/:id', validarId, eliminar);

export default router;
