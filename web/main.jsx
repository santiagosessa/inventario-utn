import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const recurso = '/api/productos';
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formularioVacio = { nombre: '', categoria: '', precio: '', stock: '0' };

async function solicitar(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error('No se pudo conectar con la API. Verificá que el servidor esté activo.');
  }
  if (respuesta.status === 204) return;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !datos) {
    const detalles = Object.values(datos?.campos ?? {}).join(' ');
    throw new Error([datos?.error ?? 'La API no respondió correctamente.', detalles].filter(Boolean).join(' '));
  }
  return datos;
}

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargaFallida, setCargaFallida] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const nombreInput = useRef(null);

  async function cargar() {
    setCargando(true);
    setCargaFallida(false);
    setError('');
    try {
      setProductos(await solicitar(recurso));
    } catch (fallo) {
      setCargaFallida(true);
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function editar(producto) {
    setEditando(producto.id);
    setFormulario({ ...producto, precio: String(producto.precio), stock: String(producto.stock) });
    setBorrando(null);
    setError('');
    setAviso('');
    nombreInput.current.focus();
  }

  function limpiarFormulario() {
    setEditando(null);
    setFormulario(formularioVacio);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setOcupado(true);
    setError('');
    setAviso('');
    const { nombre, categoria, precio, stock } = formulario;
    try {
      const producto = await solicitar(editando ? `${recurso}/${editando}` : recurso, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, categoria, precio: Number(precio), stock: Number(stock) }),
      });
      setProductos((actuales) => editando
        ? actuales.map((actual) => actual.id === producto.id ? producto : actual)
        : [producto, ...actuales]);
      setAviso(editando ? 'Producto actualizado.' : 'Producto agregado.');
      limpiarFormulario();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      await solicitar(`${recurso}/${borrando.id}`, { method: 'DELETE' });
      setProductos((actuales) => actuales.filter((producto) => producto.id !== borrando.id));
      if (editando === borrando.id) limpiarFormulario();
      setBorrando(null);
      setAviso('Producto eliminado.');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  const bloqueado = ocupado || cargando || cargaFallida;

  return (
    <>
      <header className="cabecera">
        <div className="contenedor cabecera-contenido">
          <h1>Inventario de productos</h1>
          <a href={recurso}>Ver API JSON ↗</a>
        </div>
      </header>
      <main className="contenedor contenido">
        {(error || aviso) && <p className={error ? 'mensaje error' : 'mensaje'} role={error ? 'alert' : 'status'}>{error || aviso}</p>}
        <div className="paneles">
          <section className="panel" aria-labelledby="titulo-listado" aria-busy={cargando}>
            <div className="panel-titulo">
              <h2 id="titulo-listado">Catálogo</h2>
              {!cargando && !cargaFallida && <span className="cantidad">{productos.length} {productos.length === 1 ? 'producto' : 'productos'}</span>}
            </div>
            {cargando && <p className="vacio" role="status">Cargando productos…</p>}
            {cargaFallida && <div className="vacio"><button type="button" onClick={cargar}>Reintentar</button></div>}
            {!cargando && !cargaFallida && (productos.length === 0
              ? <p className="vacio">Todavía no hay productos. Agregá el primero desde el formulario.</p>
              : <div className="tabla-scroll">
                  <table aria-labelledby="titulo-listado">
                    <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto.id}>
                          <th scope="row">{producto.nombre}<small>{producto.categoria}</small></th>
                          <td className="numero">{moneda.format(producto.precio)}</td>
                          <td className="numero">{producto.stock}</td>
                          <td><div className="acciones">
                            <button type="button" disabled={ocupado} onClick={() => editar(producto)} aria-label={`Editar ${producto.nombre}`}>Editar</button>
                            <button type="button" disabled={ocupado} onClick={() => setBorrando(producto)} aria-label={`Eliminar ${producto.nombre}`}>Eliminar</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>)}
            {borrando && <div className="confirmacion">
              <p>¿Eliminar <strong>{borrando.nombre}</strong> del catálogo?</p>
              <button type="button" disabled={ocupado} onClick={() => setBorrando(null)}>Cancelar</button>
              <button type="button" className="peligro" disabled={ocupado} onClick={eliminar}>Confirmar eliminación</button>
            </div>}
          </section>
          <section className="panel formulario" aria-labelledby="titulo-formulario">
            <h2 id="titulo-formulario">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={guardar}>
              <fieldset disabled={bloqueado}>
                <label>Nombre<input ref={nombreInput} name="nombre" required maxLength={100} value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })} /></label>
                <label>Categoría<input name="categoria" required maxLength={60} value={formulario.categoria} onChange={(evento) => setFormulario({ ...formulario, categoria: evento.target.value })} /></label>
                <div className="fila-campos">
                  <label>Precio (ARS)<input name="precio" type="number" required min="0" step="0.01" value={formulario.precio} onChange={(evento) => setFormulario({ ...formulario, precio: evento.target.value })} /></label>
                  <label>Stock<input name="stock" type="number" required min="0" step="1" value={formulario.stock} onChange={(evento) => setFormulario({ ...formulario, stock: evento.target.value })} /></label>
                </div>
                <button className="primario" type="submit">{editando ? 'Guardar cambios' : 'Agregar producto'}</button>
                {editando && <button type="button" onClick={limpiarFormulario}>Cancelar edición</button>}
              </fieldset>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<Inventario />);
