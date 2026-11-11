import React, { useState } from 'react';
import { solicitar } from './api.js';

const inicial = { nombre: '', ciudad: '' };

export default function Proveedores({ lista, cargando, errorCarga, recargar, token, onAcceso, onErrorSesion }) {
  const [formulario, setFormulario] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [archivando, setArchivando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  function limpiar() {
    setEditando(null);
    setFormulario(inicial);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      await solicitar(editando ? `/proveedores/${editando}` : '/proveedores', {
        method: editando ? 'PUT' : 'POST', datos: formulario, token,
      });
      setAviso(editando ? 'Proveedor actualizado.' : 'Proveedor agregado.');
      limpiar();
      recargar();
    } catch (fallo) {
      if (!onErrorSesion(fallo)) setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  async function archivar() {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      await solicitar(`/proveedores/${archivando.id}`, { method: 'DELETE', token });
      if (archivando.id === editando) limpiar();
      setArchivando(null);
      setAviso('Proveedor archivado.');
      recargar();
    } catch (fallo) {
      if (!onErrorSesion(fallo)) setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      {(error || aviso) && <p className={error ? 'mensaje error' : 'mensaje'} role={error ? 'alert' : 'status'}>{error || aviso}</p>}
      <div className="paneles">
        <section className="panel" aria-labelledby="titulo-proveedores" aria-busy={cargando}>
          <div className="panel-titulo"><h2 id="titulo-proveedores">Proveedores</h2></div>
          {cargando && <p className="vacio" role="status">Cargando proveedores…</p>}
          {errorCarga && <div className="vacio"><p role="alert">{errorCarga}</p><button type="button" onClick={recargar}>Reintentar</button></div>}
          {!cargando && !errorCarga && (lista.length === 0 ? <p className="vacio">Todavía no hay proveedores activos.</p> : (
            <div className="tabla-scroll">
              <table aria-labelledby="titulo-proveedores">
                <thead><tr><th scope="col">Proveedor</th><th scope="col">Ciudad</th>{token && <th scope="col">Acciones</th>}</tr></thead>
                <tbody>
                  {lista.map((proveedor) => (
                    <tr key={proveedor.id}>
                      <th scope="row">{proveedor.nombre}</th>
                      <td>{proveedor.ciudad}</td>
                      {token && <td><div className="acciones">
                        <button type="button" disabled={ocupado} aria-label={`Editar proveedor ${proveedor.nombre}`} onClick={() => {
                          setFormulario({ nombre: proveedor.nombre, ciudad: proveedor.ciudad });
                          setEditando(proveedor.id);
                          setArchivando(null);
                          setAviso('');
                          setError('');
                        }}>Editar</button>
                        <button type="button" disabled={ocupado} aria-label={`Archivar proveedor ${proveedor.nombre}`} onClick={() => setArchivando(proveedor)}>Archivar</button>
                      </div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {archivando && <div className="confirmacion">
            <p>¿Archivar <strong>{archivando.nombre}</strong>? Los productos asociados conservarán la referencia.</p>
            <button type="button" disabled={ocupado} onClick={() => setArchivando(null)}>Cancelar</button>
            <button type="button" className="peligro" disabled={ocupado} onClick={archivar}>Confirmar archivo</button>
          </div>}
        </section>
        <section className="panel formulario" aria-labelledby="titulo-formulario-proveedor">
          <h2 id="titulo-formulario-proveedor">{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          {token ? (
            <form onSubmit={guardar}>
              <fieldset disabled={ocupado}>
                <label>Nombre<input name="nombre" required maxLength={100} value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })} /></label>
                <label>Ciudad<input name="ciudad" required maxLength={80} value={formulario.ciudad} onChange={(evento) => setFormulario({ ...formulario, ciudad: evento.target.value })} /></label>
                <button className="primario" type="submit">{editando ? 'Guardar cambios' : 'Agregar proveedor'}</button>
                {editando && <button type="button" onClick={limpiar}>Cancelar edición</button>}
              </fieldset>
            </form>
          ) : <button type="button" className="primario acceso-formulario" onClick={onAcceso}>Iniciar sesión para agregar</button>}
        </section>
      </div>
    </>
  );
}
