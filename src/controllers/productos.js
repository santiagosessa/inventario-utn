import Producto from '../models/producto.js';
import Proveedor from '../models/proveedor.js';
import { mostrarProducto } from '../views/producto.js';
import { errorHttp } from '../middleware/errores.js';
import { leerConsulta } from '../services/consulta-productos.js';

function verificarExistencia(producto) {
  if (!producto) throw errorHttp(404, 'No se encontró el producto.');
}

async function verificarProveedor(datos) {
  if (datos.proveedor && !(await Proveedor.exists({ _id: datos.proveedor, archivadoEn: null }))) {
    throw errorHttp(400, 'Revisá los datos del producto.', { proveedorId: 'Elegí un proveedor activo.' });
  }
}

export async function listar(req, res) {
  const { filtro, paginado, pagina, limite } = leerConsulta(req.query);
  const consulta = Producto.find(filtro).sort({ createdAt: -1, _id: -1 }).populate('proveedor').lean();
  if (!paginado) return res.json((await consulta).map(mostrarProducto));

  const [productos, total] = await Promise.all([
    consulta.skip((pagina - 1) * limite).limit(limite),
    Producto.countDocuments(filtro),
  ]);
  res.json({ datos: productos.map(mostrarProducto), pagina, limite, total, paginas: Math.ceil(total / limite) });
}

export async function obtener(req, res) {
  const producto = await Producto.findById(req.params.id).populate('proveedor').lean();
  verificarExistencia(producto);
  res.json(mostrarProducto(producto));
}

export async function crear(req, res) {
  await verificarProveedor(req.producto);
  const nuevo = await Producto.create(req.producto);
  const producto = mostrarProducto(await nuevo.populate('proveedor'));
  res.location(`/api/productos/${producto.id}`).status(201).json(producto);
}

export async function actualizar(req, res) {
  await verificarProveedor(req.producto);
  const producto = await Producto.findByIdAndUpdate(req.params.id, req.producto, {
    returnDocument: 'after',
    runValidators: true,
  }).populate('proveedor').lean();
  verificarExistencia(producto);
  res.json(mostrarProducto(producto));
}

export async function eliminar(req, res) {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  verificarExistencia(producto);
  res.status(204).end();
}
