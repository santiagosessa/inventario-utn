import React, { useEffect, useRef, useState } from 'react';
import { solicitar } from './api.js';

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formularioVacio = { nombre: '', categoria: '', precio: '', stock: '0', proveedorId: '' };
const filtrosVacios = { q: '', categoria: '', proveedorId: '', limite: '5' };

export default function Catalogo({ proveedores, token, onAcceso, onErrorSesion }) {
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [consulta, setConsulta] = useState(filtrosVacios);
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState({ datos: [], total: 0, paginas: 0 });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const nombreInput = useRef(null);

  useEffect(() => {
    const controlador = new AbortController();
    const params = new URLSearchParams({ pagina, limite: consulta.limite });
    for (const campo of ['q', 'categoria', 'proveedorId']) {
      if (consulta[campo].trim()) params.set(campo, consulta[campo].trim());
    }
    setCargando(true);
    setErrorCarga('');
    solicitar(`/productos?${params}`, { signal: controlador.signal })
      .then((datos) => {
        const ultima = Math.max(1, datos.paginas);
        if (pagina > ultima) setPagina(ultima);
        else setResultado(datos);
      })
      .catch((fallo) => { if (!controlador.signal.aborted) setErrorCarga(fallo.message); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, pagina, revision]);

  function recargar() { setRevision((actual) => actual + 1); }

  function aplicar(evento) {
    evento.preventDefault();
    setConsulta({ ...filtros });
    setPagina(1);
  }

  function limpiarFiltros() {
    setFiltros(filtrosVacios);
    setConsulta(filtrosVacios);
    setPagina(1);
  }

  function editar(producto) {
    const { nombre, categoria, precio, stock, proveedor } = producto;
    setEditando(producto);
    setFormulario({ nombre, categoria, precio: String(precio), stock: String(stock), proveedorId: proveedor?.id ?? '' });
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
    const { nombre, categoria, precio, stock, proveedorId } = formulario;
    const datos = { nombre, categoria, precio: Number(precio), stock: Number(stock) };
    if (proveedorId !== (editando?.proveedor?.id ?? '')) datos.proveedorId = proveedorId || null;
    try {
      await solicitar(editando ? `/productos/${editando.id}` : '/productos', {
        method: editando ? 'PUT' : 'POST', datos, token,
      });
      setAviso(editando ? 'Producto actualizado.' : 'Producto agregado.');
      limpiarFormulario();
      if (!editando) setPagina(1);
      recargar();
    } catch (fallo) {
      if (!onErrorSesion(fallo)) setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      await solicitar(`/productos/${borrando.id}`, { method: 'DELETE', token });
      if (editando?.id === borrando.id) limpiarFormulario();
      setBorrando(null);
      setAviso('Producto eliminado.');
      recargar();
    } catch (fallo) {
      if (!onErrorSesion(fallo)) setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  const proveedorAnterior = editando?.proveedor;

  return (
    <>
      {(error || aviso) && <p className={error ? 'mensaje error' : 'mensaje'} role={error ? 'alert' : 'status'}>{error || aviso}</p>}
      <div className="paneles">
        <section className="panel" aria-labelledby="titulo-listado" aria-busy={cargando}>
          <div className="panel-titulo">
            <h2 id="titulo-listado">Catálogo</h2>
            {!cargando && !errorCarga && <span className="cantidad">{resultado.total} {resultado.total === 1 ? 'producto' : 'productos'}</span>}
          </div>
          <form className="filtros" onSubmit={aplicar}>
            <label>Buscar por nombre<input type="search" maxLength={100} value={filtros.q} onChange={(evento) => setFiltros({ ...filtros, q: evento.target.value })} /></label>
            <label>Filtrar por categoría<input maxLength={60} value={filtros.categoria} onChange={(evento) => setFiltros({ ...filtros, categoria: evento.target.value })} /></label>
            <label>Filtrar por proveedor<select value={filtros.proveedorId} onChange={(evento) => setFiltros({ ...filtros, proveedorId: evento.target.value })}>
              <option value="">Todos</option>
              {proveedores.map((proveedor) => <option value={proveedor.id} key={proveedor.id}>{proveedor.nombre} · {proveedor.ciudad}</option>)}
            </select></label>
            <label>Productos por página<select value={filtros.limite} onChange={(evento) => setFiltros({ ...filtros, limite: evento.target.value })}>
              <option value="2">2</option><option value="5">5</option><option value="10">10</option><option value="20">20</option>
            </select></label>
            <div className="acciones"><button className="primario" type="submit">Aplicar filtros</button><button type="button" onClick={limpiarFiltros}>Limpiar</button></div>
          </form>
          {cargando && <p className="vacio" role="status">Cargando productos…</p>}
          {errorCarga && <div className="vacio"><p role="alert">{errorCarga}</p><button type="button" onClick={recargar}>Reintentar</button></div>}
          {!cargando && !errorCarga && (resultado.datos.length === 0
            ? <p className="vacio">No se encontraron productos.</p>
            : <div className="tabla-scroll">
                <table aria-labelledby="titulo-listado">
                  <thead><tr><th scope="col">Producto</th><th scope="col">Proveedor</th><th scope="col">Precio</th><th scope="col">Stock</th>{token && <th scope="col">Acciones</th>}</tr></thead>
                  <tbody>
                    {resultado.datos.map((producto) => (
                      <tr key={producto.id}>
                        <th scope="row">{producto.nombre}<small>{producto.categoria}</small></th>
                        <td>{producto.proveedor?.nombre ?? '—'}{producto.proveedor?.archivado && <small>Archivado</small>}</td>
                        <td className="numero">{moneda.format(producto.precio)}</td>
                        <td className="numero">{producto.stock}</td>
                        {token && <td><div className="acciones">
                          <button type="button" disabled={ocupado} onClick={() => editar(producto)} aria-label={`Editar ${producto.nombre}`}>Editar</button>
                          <button type="button" disabled={ocupado} onClick={() => setBorrando(producto)} aria-label={`Eliminar ${producto.nombre}`}>Eliminar</button>
                        </div></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>)}
          {!cargando && !errorCarga && resultado.paginas > 0 && <nav className="paginacion" aria-label="Páginas de productos">
            <button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <span>Página {pagina} de {resultado.paginas}</span>
            <button type="button" disabled={pagina >= resultado.paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
          </nav>}
          {borrando && <div className="confirmacion">
            <p>¿Eliminar <strong>{borrando.nombre}</strong> del catálogo?</p>
            <button type="button" disabled={ocupado} onClick={() => setBorrando(null)}>Cancelar</button>
            <button type="button" className="peligro" disabled={ocupado} onClick={eliminar}>Confirmar eliminación</button>
          </div>}
        </section>
        <section className="panel formulario" aria-labelledby="titulo-formulario">
          <h2 id="titulo-formulario">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
          {token ? (
            <form onSubmit={guardar}>
              <fieldset disabled={ocupado}>
                <label>Nombre<input ref={nombreInput} name="nombre" required maxLength={100} value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })} /></label>
                <label>Categoría<input name="categoria" required maxLength={60} value={formulario.categoria} onChange={(evento) => setFormulario({ ...formulario, categoria: evento.target.value })} /></label>
                <div className="fila-campos">
                  <label>Precio (ARS)<input name="precio" type="number" required min="0" step="any" value={formulario.precio} onChange={(evento) => setFormulario({ ...formulario, precio: evento.target.value })} /></label>
                  <label>Stock<input name="stock" type="number" required min="0" max={Number.MAX_SAFE_INTEGER} step="1" value={formulario.stock} onChange={(evento) => setFormulario({ ...formulario, stock: evento.target.value })} /></label>
                </div>
                <label>Proveedor<select name="proveedorId" value={formulario.proveedorId} onChange={(evento) => setFormulario({ ...formulario, proveedorId: evento.target.value })}>
                  <option value="">Sin proveedor</option>
                  {proveedorAnterior && !proveedores.some((proveedor) => proveedor.id === proveedorAnterior.id) && (
                    <option value={proveedorAnterior.id}>{proveedorAnterior.nombre}{proveedorAnterior.archivado && ' (archivado)'}</option>
                  )}
                  {proveedores.map((proveedor) => <option value={proveedor.id} key={proveedor.id}>{proveedor.nombre} · {proveedor.ciudad}</option>)}
                </select></label>
                <button className="primario" type="submit">{editando ? 'Guardar cambios' : 'Agregar producto'}</button>
                {editando && <button type="button" onClick={limpiarFormulario}>Cancelar edición</button>}
              </fieldset>
            </form>
          ) : <button type="button" className="primario acceso-formulario" onClick={onAcceso}>Iniciar sesión para agregar</button>}
        </section>
      </div>
    </>
  );
}
