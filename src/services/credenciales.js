import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';

const derivarClave = promisify(scrypt);
const algoritmo = 'HS256';
const identidad = { issuer: 'inventario-utn', audience: 'inventario-api' };
export const duracionSesion = 3600;

function calcularHash(contrasena, sal) {
  return derivarClave(contrasena, Buffer.from(sal, 'hex'), 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
}

export async function crearCredenciales(contrasena) {
  const sal = randomBytes(16).toString('hex');
  const hash = (await calcularHash(contrasena, sal)).toString('hex');
  return { sal, hash };
}

export async function comprobarContrasena(contrasena, usuario) {
  const calculado = await calcularHash(contrasena, usuario?.sal ?? '0'.repeat(32));
  const coincide = timingSafeEqual(calculado, Buffer.from(usuario?.hash ?? '0'.repeat(128), 'hex'));
  return Boolean(usuario && coincide);
}

export function emitirToken(usuarioId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    ...identidad, algorithm: algoritmo, subject: usuarioId, expiresIn: duracionSesion,
  });
}

export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { ...identidad, algorithms: [algoritmo] });
}
