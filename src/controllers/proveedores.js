import Proveedor from '../models/proveedor.js';
import { mostrarProveedor } from '../views/proveedor.js';
import { errorHttp } from '../middleware/errores.js';
import { cuerpoJson } from '../middleware/solicitud.js';

const activo = { archivadoEn: null };

function leerProveedor(req) {
  const datos = cuerpoJson(req);
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const ciudad = typeof datos.ciudad === 'string' ? datos.ciudad.trim() : '';
  const campos = {};
  if (!nombre || nombre.length > 100) campos.nombre = 'Ingresá un nombre de 1 a 100 caracteres.';
  if (!ciudad || ciudad.length > 80) campos.ciudad = 'Ingresá una ciudad de 1 a 80 caracteres.';
  if (Object.keys(campos).length) throw errorHttp(400, 'Revisá los datos del proveedor.', campos);
  return { nombre, ciudad };
}

function verificarExistencia(proveedor) {
  if (!proveedor) throw errorHttp(404, 'No se encontró el proveedor activo.');
}

export async function listar(_req, res) {
  const proveedores = await Proveedor.find(activo).sort({ nombre: 1, _id: 1 }).lean();
  res.json(proveedores.map(mostrarProveedor));
}

export async function obtener(req, res) {
  const proveedor = await Proveedor.findOne({ _id: req.params.id, ...activo }).lean();
  verificarExistencia(proveedor);
  res.json(mostrarProveedor(proveedor));
}

export async function crear(req, res) {
  const proveedor = mostrarProveedor(await Proveedor.create(leerProveedor(req)));
  res.location(`/api/proveedores/${proveedor.id}`).status(201).json(proveedor);
}

export async function actualizar(req, res) {
  const proveedor = await Proveedor.findOneAndUpdate({ _id: req.params.id, ...activo }, leerProveedor(req), {
    returnDocument: 'after', runValidators: true,
  }).lean();
  verificarExistencia(proveedor);
  res.json(mostrarProveedor(proveedor));
}

export async function eliminar(req, res) {
  // La baja lógica conserva las referencias de los productos existentes.
  const proveedor = await Proveedor.findOneAndUpdate({ _id: req.params.id, ...activo }, { archivadoEn: new Date() });
  verificarExistencia(proveedor);
  res.status(204).end();
}
