export function mostrarProducto(producto) {
  return {
    id: producto._id.toString(),
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    stock: producto.stock,
    creadoEn: producto.createdAt,
    actualizadoEn: producto.updatedAt,
  };
}
