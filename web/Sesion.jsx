import React, { useState } from 'react';
import { solicitar } from './api.js';

export default function Sesion({ onSesion, onCerrar }) {
  const [registro, setRegistro] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    setOcupado(true);
    setError('');
    try {
      const sesion = await solicitar(registro ? '/auth/registro' : '/auth/login', { method: 'POST', datos });
      onSesion({ usuario: sesion.usuario, token: sesion.token, vence: Date.now() + sesion.expiraEn * 1000 });
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="panel acceso" aria-labelledby="titulo-acceso">
      <div className="encabezado-seccion">
        <h2 id="titulo-acceso">{registro ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
        <button type="button" disabled={ocupado} onClick={onCerrar}>Cerrar</button>
      </div>
      {error && <p className="mensaje error" role="alert">{error}</p>}
      <form onSubmit={enviar}>
        <fieldset disabled={ocupado}>
          {registro && <label>Nombre<input name="nombre" autoComplete="name" maxLength={80} required /></label>}
          <label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
          <label>Contraseña<input name="contrasena" type="password" autoComplete={registro ? 'new-password' : 'current-password'} minLength={12} maxLength={128} required /></label>
          <button className="primario" type="submit">{registro ? 'Registrarme' : 'Ingresar'}</button>
          <button type="button" onClick={() => { setRegistro(!registro); setError(''); }}>
            {registro ? 'Ya tengo una cuenta' : 'Crear cuenta'}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
