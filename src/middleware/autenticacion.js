import { errorHttp } from './errores.js';
import { esObjectId } from './solicitud.js';
import { verificarToken } from '../services/credenciales.js';

export function exigirSesion(req, res, next) {
  const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  try {
    const sesion = token && verificarToken(token);
    if (!esObjectId(sesion?.sub)) throw new Error('Token inválido');
    req.usuarioId = sesion.sub;
  } catch {
    res.set('WWW-Authenticate', 'Bearer');
    throw errorHttp(401, 'Iniciá sesión con un token válido.');
  }
  next();
}
