import { errorHttp } from './errores.js';
import { cuerpoJson, esObjectId } from './solicitud.js';

export function validarProducto(req, _res, next) {
  const datos = cuerpoJson(req);
  const campos = {};
  for (const [campo, limite] of [['nombre', 100], ['categoria', 60]]) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim() || datos[campo].trim().length > limite) {
      campos[campo] = `Ingresá un texto de 1 a ${limite} caracteres.`;
    }
  }
  if (!Number.isFinite(datos.precio) || datos.precio < 0) {
    campos.precio = 'Ingresá un número mayor o igual a cero.';
  }
  if ((req.method === 'PUT' || Object.hasOwn(datos, 'stock')) && (!Number.isSafeInteger(datos.stock) || datos.stock < 0)) {
    campos.stock = 'Ingresá un número entero mayor o igual a cero.';
  }
  if (Object.hasOwn(datos, 'proveedorId') && datos.proveedorId !== null && !esObjectId(datos.proveedorId)) {
    campos.proveedorId = 'Elegí un proveedor válido o enviá null.';
  }
  if (Object.keys(campos).length) throw errorHttp(400, 'Revisá los datos del producto.', campos);

  const { nombre, categoria, precio, stock } = datos;
  req.producto = { nombre: nombre.trim(), categoria: categoria.trim(), precio, stock };
  if (Object.hasOwn(datos, 'proveedorId')) req.producto.proveedor = datos.proveedorId;
  next();
}
