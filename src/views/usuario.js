export function mostrarUsuario(usuario) {
  return { id: usuario._id.toString(), nombre: usuario.nombre, email: usuario.email };
}
