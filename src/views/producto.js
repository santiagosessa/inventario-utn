import { mostrarProveedor } from './proveedor.js';

export function mostrarProducto(producto) {
  return {
    id: producto._id.toString(),
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    stock: producto.stock,
    proveedor: producto.proveedor ? mostrarProveedor(producto.proveedor) : null,
    creadoEn: producto.createdAt,
    actualizadoEn: producto.updatedAt,
  };
}
