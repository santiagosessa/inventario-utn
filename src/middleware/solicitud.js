import { errorHttp } from './errores.js';

export function esObjectId(valor) {
  return typeof valor === 'string' && /^[a-f\d]{24}$/i.test(valor);
}

export function validarId(req, _res, next) {
  if (!esObjectId(req.params.id)) {
    throw errorHttp(400, 'El ID debe ser un ObjectId válido de 24 caracteres hexadecimales.');
  }
  next();
}

export function cuerpoJson(req) {
  if (!req.is('application/json')) throw errorHttp(415, 'Enviá los datos como application/json.');
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw errorHttp(400, 'Enviá un objeto JSON.');
  }
  return req.body;
}
