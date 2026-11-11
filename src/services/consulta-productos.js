import { errorHttp } from '../middleware/errores.js';
import { esObjectId } from '../middleware/solicitud.js';

function texto(valor, campo, maximo) {
  if (valor === undefined) return '';
  if (typeof valor !== 'string' || valor.trim().length > maximo) {
    throw errorHttp(400, `El parámetro ${campo} debe ser un texto de hasta ${maximo} caracteres.`);
  }
  return valor.trim();
}

function entero(valor, campo, defecto, maximo) {
  if (valor === undefined) return defecto;
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor) || Number(valor) > maximo) {
    throw errorHttp(400, `El parámetro ${campo} debe ser un entero entre 1 y ${maximo}.`);
  }
  return Number(valor);
}

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function leerConsulta(query) {
  const q = texto(query.q, 'q', 100);
  const categoria = texto(query.categoria, 'categoria', 60);
  const filtro = {};
  if (q) filtro.nombre = new RegExp(escaparRegex(q), 'i');
  if (categoria) filtro.categoria = new RegExp(`^${escaparRegex(categoria)}$`, 'i');
  if (query.proveedorId !== undefined) {
    if (!esObjectId(query.proveedorId)) throw errorHttp(400, 'El parámetro proveedorId no es válido.');
    filtro.proveedor = query.proveedorId;
  }

  const paginado = query.pagina !== undefined || query.limite !== undefined;
  const pagina = entero(query.pagina, 'pagina', 1, 1000000);
  const limite = entero(query.limite, 'limite', 10, 100);
  return { filtro, paginado, pagina, limite };
}
