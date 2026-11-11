import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Catalogo from './Catalogo.jsx';
import Proveedores from './Proveedores.jsx';
import Sesion from './Sesion.jsx';
import { solicitar } from './api.js';
import './styles.css';

const claveSesion = 'inventario-utn-sesion';

function recuperarSesion() {
  try {
    const datos = JSON.parse(sessionStorage.getItem(claveSesion));
    if (datos?.token && datos.usuario?.id && datos.vence > Date.now()) return datos;
  } catch {
    // La sesión puede seguir en memoria si el navegador bloquea el almacenamiento.
  }
  return null;
}

function Inventario() {
  const [sesion, setSesion] = useState(recuperarSesion);
  const [acceso, setAcceso] = useState(false);
  const [seccion, setSeccion] = useState('productos');
  const [aviso, setAviso] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setErrorCarga('');
    solicitar('/proveedores', { signal: controlador.signal })
      .then(setProveedores)
      .catch((fallo) => { if (!controlador.signal.aborted) setErrorCarga(fallo.message); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [revision]);

  useEffect(() => {
    if (!sesion) return;
    const controlador = new AbortController();
    const temporizador = setTimeout(expirarSesion, Math.max(0, sesion.vence - Date.now()));
    solicitar('/auth/sesion', { token: sesion.token, signal: controlador.signal }).catch((fallo) => {
      if (!controlador.signal.aborted && fallo.estado === 401) expirarSesion();
    });
    return () => {
      controlador.abort();
      clearTimeout(temporizador);
    };
  }, [sesion]);

  function guardarSesion(nueva) {
    setSesion(nueva);
    try {
      if (nueva) sessionStorage.setItem(claveSesion, JSON.stringify(nueva));
      else sessionStorage.removeItem(claveSesion);
    } catch {
      // El almacenamiento de sesión es opcional.
    }
    setAcceso(false);
    setAviso(nueva ? `Sesión iniciada como ${nueva.usuario.nombre}.` : 'Cerraste sesión.');
  }

  function expirarSesion() {
    guardarSesion(null);
    setAviso('Tu sesión venció. Volvé a iniciar sesión.');
    setAcceso(true);
  }

  function manejarErrorSesion(fallo) {
    if (fallo.estado !== 401) return false;
    expirarSesion();
    return true;
  }

  const token = sesion?.token;
  const onAcceso = () => { setAcceso(true); setAviso(''); };
  const props = { token, onAcceso, onErrorSesion: manejarErrorSesion };

  return (
    <>
      <header className="cabecera">
        <div className="contenedor cabecera-contenido">
          <h1>Inventario de productos</h1>
          <div className="acciones-cabecera">
            <a href="/api/productos">Ver API JSON ↗</a>
            {sesion ? <>
              <span className="perfil">{sesion.usuario.nombre}</span>
              <button type="button" onClick={() => guardarSesion(null)}>Cerrar sesión</button>
            </> : <button type="button" aria-expanded={acceso} onClick={onAcceso}>Iniciar sesión</button>}
          </div>
        </div>
      </header>
      <main className="contenedor contenido">
        <nav className="secciones" aria-label="Secciones del inventario">
          <button type="button" aria-current={seccion === 'productos' ? 'page' : undefined} onClick={() => setSeccion('productos')}>Productos</button>
          <button type="button" aria-current={seccion === 'proveedores' ? 'page' : undefined} onClick={() => setSeccion('proveedores')}>Proveedores</button>
        </nav>
        {aviso && <p className="mensaje" role="status">{aviso}</p>}
        {acceso && !sesion && <Sesion onSesion={guardarSesion} onCerrar={() => setAcceso(false)} />}
        <div key={sesion?.usuario.id ?? 'visitante'}>
          {seccion === 'productos' ? <Catalogo proveedores={proveedores} {...props} /> : (
            <Proveedores lista={proveedores} cargando={cargando} errorCarga={errorCarga} recargar={() => setRevision((actual) => actual + 1)} {...props} />
          )}
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<Inventario />);
