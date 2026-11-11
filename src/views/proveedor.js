export function mostrarProveedor(proveedor) {
  return {
    id: proveedor._id.toString(),
    nombre: proveedor.nombre,
    ciudad: proveedor.ciudad,
    archivado: Boolean(proveedor.archivadoEn),
  };
}
