# Inventario de productos

Trabajo práctico integrador del Curso de Desarrollo con NodeJS de la UTN FRBA. La API REST gestiona un inventario de productos y sus proveedores. El catálogo admite búsquedas, filtros y paginación. Las consultas son públicas y cualquier cuenta registrada puede administrar el inventario compartido.

## Tecnologías

- Node.js y Express para el servidor HTTP y el enrutamiento.
- MongoDB y Mongoose para almacenar y validar los productos.
- JWT para las sesiones y `scrypt` de Node.js para almacenar las contraseñas con hash y sal.
- React y Vite para la interfaz web que consume la API con `fetch`.
- Postman para recorrer las operaciones de la API.

## Puesta en marcha

Requisitos de desarrollo: Node.js 22.12 o superior, npm y una instancia de MongoDB local o en Atlas.

1. Desde la raíz del proyecto, instalá las dependencias con `npm ci`.
2. Copiá `.env.example` como `.env` (`Copy-Item .env.example .env` en PowerShell o `cp .env.example .env` en Bash). Ajustá `MONGODB_URI` para tu instancia. El puerto predeterminado es `3000` y `HOST` indica la interfaz de escucha. Ejecutá `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y guardá el resultado en `JWT_SECRET` dentro de `.env`.
3. Asegurate de que MongoDB esté en ejecución. Si usás Docker para desarrollo local, podés iniciarlo con `docker run -d --name inventario-mongo -p 127.0.0.1:27017:27017 -v inventario-mongo-datos:/data/db mongo:8.0`.
4. Ejecutá `npm run build` para compilar la interfaz y `npm start` para conectar el servidor a MongoDB. Abrí [el inventario](http://127.0.0.1:3000/inventario/) o consultá [la API](http://127.0.0.1:3000/api/productos).

Para modificar la interfaz, ejecutá `npm run dev` y `npm run dev:web` en terminales separadas. Abrí la URL que indique Vite. En desarrollo Vite redirige `/api` a Express usando el `PORT` de `.env`. Después de compilar, Express sirve la interfaz y la API desde el mismo origen.

En la página, elegí **Iniciar sesión → Crear cuenta**. En **Proveedores** podés dar de alta uno nuevo. En **Productos** podés asociarlo desde el formulario, filtrar el listado y recorrer las páginas.

## API REST

### Autenticación

| Método | Ruta | Cuerpo o encabezado | Respuesta |
| --- | --- | --- | --- |
| `POST` | `/api/auth/registro` | `nombre`, `email`, `contrasena` | `201` · Perfil, token y vigencia en segundos |
| `POST` | `/api/auth/login` | `email`, `contrasena` | `200` · Perfil, token y vigencia en segundos |
| `GET` | `/api/auth/sesion` | `Authorization: Bearer <token>` | `200` · Perfil de la sesión |

La contraseña debe tener entre 12 y 128 caracteres. El JWT vence a los 60 minutos. Enviá `Authorization: Bearer <token>` al crear, modificar o eliminar productos y proveedores. Una sesión inválida devuelve `401`, un correo duplicado devuelve `409` y superar el límite de solicitudes de autenticación devuelve `429`.

### Productos

| Método | Ruta | Respuesta |
| --- | --- | --- |
| `GET` | `/` o `/api` | `200` · Presentación de la API |
| `GET` | `/api/productos` | `200` · Arreglo de productos, del más reciente al más antiguo |
| `GET` | `/api/productos/:id` | `200` · Producto solicitado |
| `POST` | `/api/productos` | `201` · Producto creado y encabezado `Location` |
| `PUT` | `/api/productos/:id` | `200` · Producto actualizado |
| `DELETE` | `/api/productos/:id` | `204` · Eliminación confirmada, con cuerpo vacío |

Ejemplo de cuerpo para crear o actualizar un producto. Enviá `Content-Type: application/json`.

```json
{
  "nombre": "Cuaderno A5",
  "categoria": "Librería",
  "precio": 4500.50,
  "stock": 12
}
```

`nombre` y `categoria` son textos obligatorios de hasta 100 y 60 caracteres respectivamente. `precio` es un número mayor o igual a cero. `stock` es un entero mayor o igual a cero y toma el valor `0` si se omite al crear. `PUT` requiere esos cuatro campos. Enviá `proveedorId` para asociar un proveedor activo o `null` para quitar la asociación. Al actualizar, omitir `proveedorId` conserva la asociación actual. La respuesta incluye `proveedor` con los datos del proveedor asociado o `null`, además de `id`, `creadoEn` y `actualizadoEn`.

#### Búsqueda, filtros y paginación

| Parámetro | Comportamiento |
| --- | --- |
| `q` | Búsqueda parcial por nombre, sin distinguir mayúsculas. |
| `categoria` | Coincidencia exacta por categoría, sin distinguir mayúsculas. |
| `proveedorId` | Filtra por el ID del proveedor asociado. |
| `pagina` | Número de página, desde 1. Predeterminado: 1. |
| `limite` | Registros por página, entre 1 y 100. Predeterminado: 10. |

Los filtros se pueden combinar. `GET /api/productos?q=cuaderno&pagina=1&limite=5` devuelve `{ datos, pagina, limite, total, paginas }`. Si omitís `pagina` y `limite`, la respuesta es un arreglo con todos los resultados de la consulta.

### Proveedores

| Método | Ruta | Respuesta |
| --- | --- | --- |
| `GET` | `/api/proveedores` | `200` · Lista de proveedores activos |
| `GET` | `/api/proveedores/:id` | `200` · Proveedor activo |
| `POST` | `/api/proveedores` | `201` · Proveedor creado |
| `PUT` | `/api/proveedores/:id` | `200` · Proveedor actualizado |
| `DELETE` | `/api/proveedores/:id` | `204` · Proveedor archivado |

Para crear o actualizar un proveedor, enviá `nombre` y `ciudad`. Un proveedor puede estar asociado a varios productos. Al archivarlo, desaparece de la lista de activos y los productos existentes conservan la referencia. Los productos nuevos solo pueden asociarse a proveedores activos.

### Errores

Un ID mal formado, JSON inválido o datos inválidos devuelven `400`. Un ID válido sin coincidencia o una ruta desconocida devuelven `404`. Un cuerpo de más de 16 KB devuelve `413`. Un tipo de contenido incompatible devuelve `415`. Los errores de validación incluyen `error` y, cuando corresponde, un objeto `campos` con el detalle.

## Pruebas con Postman

Importá [la colección](postman/Inventario.postman_collection.json) y ejecutala en orden con el Collection Runner sobre una base de desarrollo. Si cambiaste el puerto, ajustá `baseUrl`. La colección genera una cuenta de prueba, obtiene el JWT y guarda los IDs de los registros de prueba. Verifica autenticación, CRUD, filtros, paginación y la relación con el proveedor.

Para correr las pruebas automatizadas, iniciá MongoDB y ejecutá `npm test`. Cada ejecución usa una base temporal independiente y la elimina al terminar. Por defecto se conecta a MongoDB en `127.0.0.1:27017`. Podés indicar otro servidor con `TEST_MONGODB_URI`.

## Fuentes

- [Enrutamiento en Express](https://expressjs.com/en/guide/routing.html) · [Manejo de errores](https://expressjs.com/en/guide/error-handling/)
- [Conexiones con Mongoose](https://mongoosejs.com/docs/connections.html) · [Validación](https://mongoosejs.com/docs/validation.html)
- [Operaciones CRUD de MongoDB](https://www.mongodb.com/docs/manual/crud/)
- [JSON Web Tokens con jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) · [Función scrypt de Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)
- [Peticiones de datos con React](https://react.dev/reference/react/useEffect#fetching-data)
