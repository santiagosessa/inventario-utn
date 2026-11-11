import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Producto from '../src/models/producto.js';
import Usuario from '../src/models/usuario.js';

const dbName = `inventario_prueba_${randomUUID().replaceAll('-', '')}`;
const uri = process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const secreto = randomBytes(32).toString('hex');
const contrasena = 'Prueba local 12345';
const altaCuenta = { nombre: 'Cuenta de prueba', email: 'prueba@example.test', contrasena };
let servidor;
let baseUrl;
let token;

before(async () => {
  process.env.JWT_SECRET = secreto;
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  await Usuario.init();
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;
});

after(async () => {
  try {
    if (servidor) await new Promise((resolve) => servidor.close(resolve));
    if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }
});

async function solicitar(ruta, estado, { method = 'GET', datos, sesion } = {}) {
  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    method,
    headers: {
      ...(datos !== undefined && { 'Content-Type': 'application/json' }),
      ...(sesion && { Authorization: `Bearer ${sesion}` }),
    },
    body: datos === undefined ? undefined : JSON.stringify(datos),
  });
  const cuerpo = await respuesta.text();
  assert.equal(respuesta.status, estado, `${method} ${ruta}: ${cuerpo}`);
  return { cuerpo: cuerpo ? JSON.parse(cuerpo) : undefined, headers: respuesta.headers };
}

test('registro, inicio de sesión y protección de las escrituras', async () => {
  const resultados = await Promise.all([
    fetch(`${baseUrl}/auth/registro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(altaCuenta),
    }),
    fetch(`${baseUrl}/auth/registro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(altaCuenta),
    }),
  ]);
  assert.deepEqual(resultados.map((respuesta) => respuesta.status).sort(), [201, 409]);
  const creada = await resultados.find((respuesta) => respuesta.status === 201).json();
  assert.deepEqual(Object.keys(creada.usuario).sort(), ['email', 'id', 'nombre']);
  assert.equal(creada.expiraEn, 3600);

  const guardado = await Usuario.findOne({ email: altaCuenta.email }).select('+hash +sal').lean();
  assert.match(guardado.hash, /^[a-f\d]{128}$/);
  assert.match(guardado.sal, /^[a-f\d]{32}$/);
  assert.equal(guardado.contrasena, undefined);

  const ingreso = await solicitar('/auth/login', 200, {
    method: 'POST', datos: { email: 'PRUEBA@example.test', contrasena },
  });
  token = ingreso.cuerpo.token;
  assert.equal(ingreso.headers.get('cache-control'), 'no-store');
  assert.equal((await solicitar('/auth/sesion', 200, { sesion: token })).cuerpo.usuario.id, creada.usuario.id);
  await solicitar('/auth/login', 401, {
    method: 'POST', datos: { email: altaCuenta.email, contrasena: 'Incorrecta local 123' },
  });
  await solicitar('/auth/registro', 400, {
    method: 'POST', datos: { ...altaCuenta, email: 'invalido', contrasena: 'corta' },
  });

  const vencido = jwt.sign({}, secreto, {
    subject: creada.usuario.id, issuer: 'inventario-utn', audience: 'inventario-api', expiresIn: -1,
  });
  const noAutorizado = await solicitar('/productos', 401, { method: 'POST', datos: {} });
  assert.equal(noAutorizado.headers.get('www-authenticate'), 'Bearer');
  await solicitar('/productos', 401, { method: 'POST', datos: {}, sesion: vencido });
  await solicitar('/proveedores', 401, { method: 'POST', datos: {}, sesion: 'invalido' });
});

test('proveedores, productos existentes y paginación con filtros combinados', async () => {
  const { cuerpo: proveedor } = await solicitar('/proveedores', 201, {
    method: 'POST', datos: { nombre: 'Distribuidora de prueba', ciudad: 'Buenos Aires' }, sesion: token,
  });
  const rutaProveedor = `/proveedores/${proveedor.id}`;
  assert.equal((await solicitar(rutaProveedor, 200)).cuerpo.ciudad, 'Buenos Aires');
  await solicitar(rutaProveedor, 200, {
    method: 'PUT', datos: { nombre: proveedor.nombre, ciudad: 'Córdoba' }, sesion: token,
  });

  const anterior = await Producto.collection.insertOne({
    nombre: 'Cuaderno anterior', categoria: 'Librería', precio: 1200, stock: 2, createdAt: new Date(0),
  });
  const datos = { nombre: 'Cuaderno [A5]', categoria: 'Librería', precio: 4500.5, proveedorId: proveedor.id };
  const alta = await solicitar('/productos', 201, { method: 'POST', datos, sesion: token });
  const { id } = alta.cuerpo;
  const rutaProducto = `/productos/${id}`;
  assert.equal(alta.headers.get('location'), `/api${rutaProducto}`);
  assert.equal(alta.cuerpo.stock, 0);
  assert.equal(alta.cuerpo.proveedor.ciudad, 'Córdoba');
  assert.equal((await solicitar(`/productos/${anterior.insertedId}`, 200)).cuerpo.proveedor, null);
  assert.equal((await solicitar('/productos', 200)).cuerpo.length, 2);

  const filtro = new URLSearchParams({ q: '[a5]', categoria: 'librería', proveedorId: proveedor.id, limite: 1, pagina: 1 });
  const filtrado = (await solicitar(`/productos?${filtro}`, 200)).cuerpo;
  assert.deepEqual({ pagina: filtrado.pagina, limite: filtrado.limite, total: filtrado.total, paginas: filtrado.paginas }, {
    pagina: 1, limite: 1, total: 1, paginas: 1,
  });
  assert.equal(filtrado.datos[0].id, id);
  const segunda = (await solicitar('/productos?pagina=2&limite=1', 200)).cuerpo;
  assert.equal(segunda.datos[0].id, anterior.insertedId.toString());
  assert.equal(segunda.paginas, 2);
  await solicitar('/productos?pagina=0', 400);
  await solicitar('/productos?limite=101', 400);
  await solicitar('/productos?proveedorId=invalido', 400);
  await solicitar('/productos?q=a&q=b', 400);
  await solicitar('/productos/invalido', 400);
  await solicitar('/productos', 400, {
    method: 'POST', datos: { ...datos, proveedorId: '000000000000000000000000' }, sesion: token,
  });

  await solicitar(rutaProveedor, 204, { method: 'DELETE', sesion: token });
  await solicitar(rutaProveedor, 404);
  assert.deepEqual((await solicitar('/proveedores', 200)).cuerpo, []);
  assert.equal((await solicitar(rutaProducto, 200)).cuerpo.proveedor.archivado, true);
  await solicitar('/productos', 400, { method: 'POST', datos, sesion: token });
  const edicion = { nombre: datos.nombre, categoria: datos.categoria, precio: datos.precio, stock: 12 };
  const actualizado = (await solicitar(rutaProducto, 200, { method: 'PUT', datos: edicion, sesion: token })).cuerpo;
  assert.equal(actualizado.stock, 12);
  assert.equal(actualizado.proveedor.id, proveedor.id);
  const desasociado = await solicitar(rutaProducto, 200, {
    method: 'PUT', datos: { ...edicion, proveedorId: null }, sesion: token,
  });
  assert.equal(desasociado.cuerpo.proveedor, null);
  await solicitar(rutaProducto, 204, { method: 'DELETE', sesion: token });
  await solicitar(rutaProducto, 404);
});
