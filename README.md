# Inventario de productos

Trabajo práctico integrador del Curso de Desarrollo con NodeJS de la UTN FRBA. La API REST permite crear, consultar, actualizar y eliminar productos de un inventario. Cada producto tiene nombre, categoría, precio en pesos argentinos y stock.

## Tecnologías

- Node.js y Express para el servidor HTTP y el enrutamiento.
- MongoDB y Mongoose para almacenar y validar los productos.
- React y Vite para la interfaz web que consume la API con `fetch`.
- Postman para recorrer las operaciones de la API.

## Puesta en marcha

Requisitos de desarrollo: Node.js 22.12 o superior, npm y una instancia de MongoDB local o en Atlas.

1. Desde la raíz del proyecto, instalá las dependencias con `npm ci`.
2. Copiá `.env.example` como `.env` (`Copy-Item .env.example .env` en PowerShell o `cp .env.example .env` en Bash). Ajustá `MONGODB_URI` para tu instancia. El puerto predeterminado es `3000` y `HOST` indica la interfaz de escucha.
3. Asegurate de que MongoDB esté en ejecución. Si usás Docker para desarrollo local, podés iniciarlo con `docker run -d --name inventario-mongo -p 127.0.0.1:27017:27017 -v inventario-mongo-datos:/data/db mongo:8.0`.
4. Ejecutá `npm run build` para compilar la interfaz y `npm start` para conectar el servidor a MongoDB. Abrí [el inventario](http://127.0.0.1:3000/inventario/) o consultá [la API](http://127.0.0.1:3000/api/productos).

Para modificar la interfaz, ejecutá `npm run dev` y `npm run dev:web` en terminales separadas. Abrí la URL que indique Vite. En desarrollo Vite redirige `/api` a Express usando el `PORT` de `.env`. Después de compilar, Express sirve la interfaz y la API desde el mismo origen.

## API REST

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

`nombre` y `categoria` son textos obligatorios de hasta 100 y 60 caracteres respectivamente. `precio` es un número mayor o igual a cero. `stock` es un entero mayor o igual a cero y toma el valor `0` si se omite al crear. `PUT` requiere los cuatro campos editables. Las respuestas de producto incluyen `id`, `creadoEn` y `actualizadoEn`.

Un ID mal formado, JSON inválido o datos inválidos devuelven `400`. Un ID válido sin coincidencia o una ruta desconocida devuelven `404`. Un cuerpo de más de 16 KB devuelve `413`. Un tipo de contenido incompatible devuelve `415`. Los errores de validación incluyen `error` y, cuando corresponde, un objeto `campos` con el detalle.

## Pruebas con Postman

Importá [la colección](postman/Inventario.postman_collection.json) y ejecutala en orden con el Collection Runner. Si cambiaste el puerto, ajustá la variable `baseUrl`. La solicitud de alta guarda el ID que usan las siguientes operaciones. La colección verifica el listado, la consulta, la actualización, la eliminación y los casos de datos inválidos y producto inexistente.

## Fuentes

- [Enrutamiento en Express](https://expressjs.com/en/guide/routing.html) · [Manejo de errores](https://expressjs.com/en/guide/error-handling/)
- [Conexiones con Mongoose](https://mongoosejs.com/docs/connections.html) · [Validación](https://mongoosejs.com/docs/validation.html)
- [Operaciones CRUD de MongoDB](https://www.mongodb.com/docs/manual/crud/)
- [Peticiones de datos con React](https://react.dev/reference/react/useEffect#fetching-data)
