import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar } from '../controllers/proveedores.js';
import { exigirSesion } from '../middleware/autenticacion.js';
import { validarId } from '../middleware/solicitud.js';

const router = Router();

router.get('/', listar);
router.post('/', exigirSesion, crear);
router.get('/:id', validarId, obtener);
router.put('/:id', exigirSesion, validarId, actualizar);
router.delete('/:id', exigirSesion, validarId, eliminar);

export default router;
