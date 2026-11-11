export function errorHttp(estado, mensaje, campos) {
  return Object.assign(new Error(mensaje), { estado, campos });
}

export function manejarError(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.estado) {
    return res.status(error.estado).json({ error: error.message, campos: error.campos });
  }
  if (error.name === 'ValidationError') {
    const campos = Object.fromEntries(Object.entries(error.errors).map(([campo, detalle]) => [campo, detalle.message]));
    return res.status(400).json({ error: 'Revisá los datos enviados.', campos });
  }
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'El JSON es inválido.' });
  if (error.status === 413) return res.status(413).json({ error: 'El cuerpo de la solicitud supera los 16 KB.' });
  if (error.status === 415) return res.status(415).json({ error: 'El formato de la solicitud no es compatible.' });
  console.error('Error al procesar la solicitud:', error.name);
  return res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
}
