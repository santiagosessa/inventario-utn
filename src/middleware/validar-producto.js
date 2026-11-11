import { errorHttp } from './errores.js';

export function validarId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    throw errorHttp(400, 'El ID debe ser un ObjectId válido de 24 caracteres hexadecimales.');
  }
  next();
}

export function validarProducto(req, _res, next) {
  if (!req.is('application/json')) throw errorHttp(415, 'Enviá los datos como application/json.');

  const datos = req.body;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw errorHttp(400, 'Enviá un objeto JSON con los datos del producto.');
  }

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
  if (Object.keys(campos).length) throw errorHttp(400, 'Revisá los datos del producto.', campos);

  const { nombre, categoria, precio, stock } = datos;
  req.producto = { nombre: nombre.trim(), categoria: categoria.trim(), precio, stock };
  next();
}
