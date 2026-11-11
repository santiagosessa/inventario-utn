import Usuario from '../models/usuario.js';
import { mostrarUsuario } from '../views/usuario.js';
import { errorHttp } from '../middleware/errores.js';
import { cuerpoJson } from '../middleware/solicitud.js';
import { comprobarContrasena, crearCredenciales, duracionSesion, emitirToken } from '../services/credenciales.js';

function leerCredenciales(req, esRegistro) {
  const datos = cuerpoJson(req);
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const contrasena = datos.contrasena;
  const campos = {};

  if (esRegistro && (!nombre || nombre.length > 80)) campos.nombre = 'Ingresá un nombre de 1 a 80 caracteres.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) campos.email = 'Ingresá un correo válido.';
  if (typeof contrasena !== 'string' || contrasena.length < 12 || contrasena.length > 128) {
    campos.contrasena = 'Ingresá entre 12 y 128 caracteres.';
  }
  if (Object.keys(campos).length) throw errorHttp(400, 'Revisá los datos de la cuenta.', campos);
  return { nombre, email, contrasena };
}

function responderSesion(res, estado, usuario) {
  const perfil = mostrarUsuario(usuario);
  res.set('Cache-Control', 'no-store').status(estado).json({
    usuario: perfil, token: emitirToken(perfil.id), expiraEn: duracionSesion,
  });
}

export async function registrar(req, res) {
  const { nombre, email, contrasena } = leerCredenciales(req, true);
  const credenciales = await crearCredenciales(contrasena);
  try {
    const usuario = await Usuario.create({ nombre, email, ...credenciales });
    responderSesion(res, 201, usuario);
  } catch (error) {
    if (error.code === 11000) throw errorHttp(409, 'Ya existe una cuenta con ese correo.');
    throw error;
  }
}

export async function ingresar(req, res) {
  const { email, contrasena } = leerCredenciales(req, false);
  const usuario = await Usuario.findOne({ email }).select('+sal +hash').lean();
  if (!(await comprobarContrasena(contrasena, usuario))) throw errorHttp(401, 'Correo o contraseña incorrectos.');
  responderSesion(res, 200, usuario);
}

export async function obtenerSesion(req, res) {
  const usuario = await Usuario.findById(req.usuarioId).lean();
  if (!usuario) throw errorHttp(401, 'Iniciá sesión con una cuenta válida.');
  res.set('Cache-Control', 'no-store').json({ usuario: mostrarUsuario(usuario) });
}
