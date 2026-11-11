import Producto from '../models/producto.js';
import { mostrarProducto } from '../views/producto.js';
import { errorHttp } from '../middleware/errores.js';

function verificarExistencia(producto) {
  if (!producto) throw errorHttp(404, 'No se encontró el producto.');
}

export async function listar(_req, res) {
  const productos = await Producto.find().sort({ createdAt: -1, _id: -1 }).lean();
  res.json(productos.map(mostrarProducto));
}

export async function obtener(req, res) {
  const producto = await Producto.findById(req.params.id).lean();
  verificarExistencia(producto);
  res.json(mostrarProducto(producto));
}

export async function crear(req, res) {
  const producto = mostrarProducto(await Producto.create(req.producto));
  res.location(`/api/productos/${producto.id}`).status(201).json(producto);
}

export async function actualizar(req, res) {
  const producto = await Producto.findByIdAndUpdate(req.params.id, req.producto, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  verificarExistencia(producto);
  res.json(mostrarProducto(producto));
}

export async function eliminar(req, res) {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  verificarExistencia(producto);
  res.status(204).end();
}
