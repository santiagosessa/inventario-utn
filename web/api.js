export async function solicitar(ruta, { method = 'GET', datos, token, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method,
      headers: {
        ...(datos !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: datos === undefined ? undefined : JSON.stringify(datos),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con la API. Verificá que el servidor esté activo.');
  }

  if (respuesta.status === 204) return;
  const contenido = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !contenido) {
    const detalles = Object.values(contenido?.campos ?? {}).join(' ');
    const mensaje = [contenido?.error ?? 'La API no respondió correctamente.', detalles].filter(Boolean).join(' ');
    throw Object.assign(new Error(mensaje), { estado: respuesta.status });
  }
  return contenido;
}
