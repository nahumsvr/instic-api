# Endpoints — Referencia Completa

> **Convención de seguridad**  
> Salvo `POST /auth/login`, todos los endpoints requieren el header:  
> `Authorization: Bearer <token>`  
> Los roles disponibles son: `ADMIN`, `MANAGER`, `EMPLOYEE`.

---

## 1. Autenticación — `/auth`

### `POST /auth/login`
Autentica a un usuario y devuelve un JWT.

- **Acceso**: Público (sin token).
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `email` | string | ✅ | Correo registrado del usuario |
  | `password` | string | ✅ | Contraseña en texto plano |
- **Respuesta exitosa `200`**: `{ accessToken: string }`
- **Relaciones**:
  - El `accessToken` recibido debe incluirse en todos los demás endpoints como `Authorization: Bearer <token>`.

---

### `POST /auth/logout`
Invalida la sesión actual del usuario.

- **Acceso**: Autenticado.
- **Roles**: Cualquiera.
- **Body**: Ninguno.
- **Respuesta exitosa `200`**: Mensaje de confirmación.
- **Notas**: La API es _stateless_ (JWT), por lo que el logout es lógico (el cliente descarta el token).

---

## 2. Usuarios — `/users`

> Todos los endpoints de este recurso son exclusivos de `ADMIN`.

### `POST /users`
Crea un nuevo usuario en el sistema.

- **Roles**: `ADMIN`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `name` | string | ✅ | Nombre completo |
  | `email` | string | ✅ | Correo único |
  | `password` | string | ✅ | Se almacena hasheada con bcrypt |
  | `role` | `ADMIN` \| `MANAGER` \| `EMPLOYEE` | ✅ | Rol del usuario |
- **Errores comunes**: `409 Conflict` si el email ya existe; `400 Bad Request` si el rol no es válido.
- **Relaciones**:
  - Un usuario con rol `MANAGER` o `EMPLOYEE` necesita estar creado aquí antes de poder iniciar sesión con `POST /auth/login`.

---

### `GET /users`
Lista todos los usuarios registrados.

- **Roles**: `ADMIN`
- **Respuesta**: Array de usuarios (sin contraseña).

---

### `GET /users/:id`
Obtiene el detalle de un usuario por su ID.

- **Roles**: `ADMIN`
- **Parámetros**: `id` — ID numérico del usuario.
- **Errores comunes**: `404` si no existe.

---

### `PATCH /users/:id`
Actualiza los datos de un usuario.

- **Roles**: `ADMIN`
- **Parámetros**: `id` — ID numérico.
- **Body**: Cualquier subconjunto de los campos de creación (todos opcionales).
- **Errores comunes**: `404` si no existe; `409` si el nuevo email ya está en uso.

---

### `DELETE /users/:id`
Elimina un usuario del sistema.

- **Roles**: `ADMIN`
- **Parámetros**: `id` — ID numérico.
- **Errores comunes**: `404` si no existe.

---

## 3. Ubicaciones — `/locations`

Gestiona tiendas y almacenes. Son el nodo central del inventario y los movimientos.

### `POST /locations`
Crea una nueva ubicación (tienda o almacén).

- **Roles**: `ADMIN`, `MANAGER`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `code` | string | ✅ | Código único de identificación |
  | `name` | string | ✅ | Nombre descriptivo |
  | `type` | `TIENDA` \| `ALMACEN` | ✅ | Tipo de ubicación |
  | `storageCost` | number | ✅ | Costo mensual de almacenamiento |
- **Relaciones**:
  - Las ubicaciones son referenciadas como `originId` / `destinationId` en `POST /movements/*` y `POST /orders`.
  - Aparecen en `GET /alerts` cuando su inventario cae por debajo del mínimo.

---

### `GET /locations`
Lista todas las ubicaciones registradas.

- **Roles**: Todos los autenticados.
- **Respuesta**: Array con todas las ubicaciones.

---

### `GET /locations/:id/inventory`
Devuelve el inventario completo de una ubicación específica, incluyendo costos calculados.

- **Roles**: Todos los autenticados.
- **Parámetros**: `id` — ID de la ubicación.
- **Respuesta**: Lista de registros de inventario con artículo, cantidades y costo de almacenamiento.
- **Errores comunes**: `404` si la ubicación no existe.
- **Relaciones**:
  - La información mostrada aquí se actualiza automáticamente al ejecutar movimientos (`POST /movements/*`) con estado `COMPLETED`.
  - Si `cantidad_actual < stock_minimo`, este artículo/ubicación aparecerá en `GET /alerts`.

---

### `PATCH /locations/:id/storage-cost`
Actualiza el costo mensual de almacenamiento de una ubicación.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID de la ubicación.
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `storageCost` | number | ✅ | Nuevo costo mensual |
- **Errores comunes**: `404` si no existe.

---

## 4. Artículos — `/articles`

### `POST /articles`
Registra un nuevo artículo en el catálogo.

- **Roles**: `ADMIN`, `MANAGER`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `code` | string | ✅ | Código único (SKU) |
  | `name` | string | ✅ | Nombre del artículo |
  | `description` | string | ❌ | Descripción opcional |
  | `category` | string | ✅ | Categoría |
  | `size` | string | ✅ | Talla / tamaño |
  | `unitPrice` | number | ✅ | Precio de venta |
  | `unitCost` | number | ✅ | Costo de adquisición |
  | `stockConfigs` | `StockConfig[]` | ❌ | Configuración inicial de stock por ubicación |
- **`StockConfig`**:
  | Campo | Tipo | Descripción |
  |---|---|---|
  | `locationId` | number | ID de la ubicación |
  | `minStock` | number | Stock mínimo |
  | `maxStock` | number | Stock máximo |
- **Errores comunes**: `409` si el `code` ya existe; `404` si algún `locationId` en `stockConfigs` no existe.
- **Relaciones**:
  - Los artículos son referenciados como `articleId` en `POST /movements/*`, `POST /orders` y `GET /alerts`.

---

### `GET /articles`
Lista artículos con filtros opcionales.

- **Roles**: `ADMIN`, `MANAGER`
- **Query params**:
  | Param | Tipo | Descripción |
  |---|---|---|
  | `search` | string | Busca por nombre o código (ILIKE) |
  | `category` | string | Filtra por categoría exacta |
  | `status` | `active` \| `inactive` \| `all` | Por defecto: `active` |
- **Respuesta**: Array de artículos que cumplen los filtros.

---

### `GET /articles/:id`
Obtiene el detalle completo de un artículo activo, incluyendo inventario por ubicación y historial de demanda.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del artículo.
- **Errores comunes**: `404` si no existe o está inactivo.
- **Relaciones**:
  - La sección de inventario refleja el resultado acumulado de los movimientos completados.
  - La demanda histórica se usa para calcular el pronóstico de reabastecimiento.

---

### `PATCH /articles/:id`
Actualiza los atributos editables de un artículo.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del artículo.
- **Body**: Subconjunto parcial de los campos de creación (todos opcionales).
- **Errores comunes**: `404`; `409` si el nuevo `code` ya existe.

---

### `DELETE /articles/:id`
Marca un artículo como **discontinuado** (soft delete — `is_active = false`).

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del artículo.
- **Notas**: El artículo no se elimina físicamente. Deja de aparecer en listados y alertas.
- **Relaciones**:
  - Para revertirlo, usar `PATCH /articles/:id/reactivate`.

---

### `PATCH /articles/:id/reactivate`
Reactiva un artículo discontinuado.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del artículo.
- **Errores comunes**: `404` si no existe; `409` si ya está activo.

---

### `POST /articles/:id/demand`
Registra la demanda mensual de un artículo en una ubicación y recalcula el pronóstico.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del artículo.
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `locationId` | number | ✅ | Ubicación donde ocurrió la demanda |
  | `year` | number | ✅ | Año del registro |
  | `month` | number | ✅ | Mes del registro (1–12) |
  | `quantity` | number | ✅ | Unidades demandadas |
- **Respuesta**: `{ message, forecast, historicalCount }` — el pronóstico es el promedio móvil de los últimos 3 períodos.
- **Relaciones**:
  - El pronóstico resultante puede ser usado para decidir la cantidad en `POST /orders`.

---

## 5. Movimientos — `/movements`

Los movimientos son las transacciones reales que modifican el inventario.

### `POST /movements/input`
Registra una **entrada** de mercancía a una ubicación.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `articleId` | number | ✅ | Artículo que ingresa |
  | `quantity` | number | ✅ | Cantidad (≥ 1) |
  | `destinationId` | number | ✅ | Ubicación de destino |
  | `originId` | number | ❌ | Origen (opcional si viene de proveedor externo) |
  | `status` | `MovementStatus` | ❌ | Por defecto: `COMPLETED` |
- **Efecto en inventario**: Solo si `status = COMPLETED` → incrementa `cantidad_actual` en el destino.
- **Relaciones**:
  - Si se crea con `status = PENDING`, usar `PATCH /movements/:id/status` para completarlo y aplicar el inventario.
  - Este movimiento es el que **ejecuta** una orden de reabastecimiento aprobada en `PATCH /orders/:id/state`.

---

### `POST /movements/output`
Registra una **salida** de mercancía desde una ubicación.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `articleId` | number | ✅ | Artículo que egresa |
  | `quantity` | number | ✅ | Cantidad (≥ 1) |
  | `originId` | number | ✅ | Ubicación de origen |
  | `destinationId` | number | ❌ | Destino (opcional si es venta final) |
  | `status` | `MovementStatus` | ❌ | Por defecto: `COMPLETED` |
- **Efecto en inventario**: Solo si `status = COMPLETED` → decrementa `cantidad_actual` en el origen.
- **Errores comunes**: `409` si stock insuficiente al completar.

---

### `POST /movements/transfer`
Registra una **transferencia** de mercancía entre dos ubicaciones.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `articleId` | number | ✅ | Artículo a transferir |
  | `quantity` | number | ✅ | Cantidad (≥ 1) |
  | `originId` | number | ✅ | Ubicación de origen |
  | `destinationId` | number | ✅ | Ubicación de destino (distinta al origen) |
  | `status` | `MovementStatus` | ❌ | Por defecto: `COMPLETED` |
- **Efecto en inventario**: Solo si `status = COMPLETED` → decrementa en origen e incrementa en destino.
- **Errores comunes**: `400` si origen = destino; `409` si stock insuficiente.

---

### `GET /movements`
Lista movimientos con filtros opcionales.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Query params**:
  | Param | Tipo | Descripción |
  |---|---|---|
  | `type` | `INPUT` \| `OUTPUT` \| `TRANSFER` | Filtra por tipo de movimiento |
  | `status` | `MovementStatus` | Filtra por estado |
  | `locationId` | number | Filtra movimientos donde esa ubicación es origen o destino |
- **Respuesta**: Array de movimientos con artículo y ubicaciones relacionadas, ordenados por fecha descendente.
- **Relaciones**:
  - Usar `locationId` para la **Vista Almacén**: ver todos los movimientos que involucran a una ubicación específica (equivalente al filtro de `GET /orders?locationId=`).

---

### `POST /movements/:id/cancel`
Cancela un movimiento existente y revierte el inventario si ya estaba `COMPLETED`.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID del movimiento.
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `cancelReason` | string | ✅ | Motivo de la anulación |
- **Efecto en inventario**: Revierte la operación original si el movimiento estaba en `COMPLETED`.
- **Errores comunes**: `409` si ya está cancelado; `409` si la reversión causaría stock negativo.

---

### `PATCH /movements/:id/status`
Actualiza el estado de un movimiento pendiente.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Parámetros**: `id` — ID del movimiento.
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `status` | `MovementStatus` | ✅ | Nuevo estado |
- **Efecto en inventario**: Si el nuevo estado es `COMPLETED`, aplica el efecto sobre el inventario en ese momento.
- **Errores comunes**: `409` si el movimiento ya está en `COMPLETED` o `CANCELLED`.
- **Relaciones**:
  - Flujo típico: crear movimiento con `PENDING` → aprobarlo con `APPROVED` → ejecutarlo con `COMPLETED`.

---

## 6. Órdenes y Alertas — `/orders` & `/alerts`

Las órdenes representan solicitudes de reabastecimiento. Las alertas son generadas automáticamente desde el inventario.

### `GET /alerts`
Lista todas las alertas activas clasificadas por severidad.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Body**: Ninguno.
- **Lógica de severidad** (basada en `cantidad_actual` vs `stock_minimo`):
  | Severidad | Condición |
  |---|---|
  | `CRITICO` | `cantidad_actual === 0` |
  | `ALTO` | `cantidad_actual ≤ stock_minimo × 0.5` |
  | `MEDIO` | `cantidad_actual > stock_minimo × 0.5` y `< stock_minimo` |
- **Respuesta por alerta**:
  ```json
  {
    "inventoryId": 12,
    "article": { "id": 3, "code": "SKU-001", "name": "Camiseta M" },
    "location": { "id": 1, "code": "ALM-01", "name": "Almacén Central" },
    "stockActual": 2,
    "stockMinimo": 10,
    "stockMaximo": 50,
    "deficit": 8,
    "severity": "ALTO"
  }
  ```
- **Relaciones**:
  - Una alerta es el punto de partida para crear una orden de reabastecimiento con `POST /orders`.
  - El `deficit` sugiere la cantidad mínima para el campo `quantity` en `POST /orders`.
  - El `inventoryId` permite identificar el artículo (`articleId`) y la ubicación (`destinationId`) para la nueva orden.

---

### `POST /orders`
Genera una orden de reabastecimiento manual y devuelve su QR único.

- **Roles**: `ADMIN`, `MANAGER`
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `articleId` | number | ✅ | Artículo a reabastecer |
  | `quantity` | number | ✅ | Cantidad solicitada (≥ 1) |
  | `originId` | number | ✅ | Ubicación de origen (proveedor o almacén central) |
  | `destinationId` | number | ✅ | Ubicación que recibirá la mercancía |
- **Respuesta**: Orden creada con `estado: PENDING` + campo `qrUrl: /orders/<qrCode>`.
- **Errores comunes**: `404` si artículo o ubicaciones no existen; `400` si artículo inactivo.
- **Relaciones**:
  - Se crea típicamente como respuesta a una alerta de `GET /alerts`.
  - El `qrUrl` generado es el que se escanea en la Vista Almacén para obtener el detalle vía `GET /orders/:qrCode`.
  - Para avanzar su estado, usar `PATCH /orders/:id/state`.
  - Una vez la orden sea `COMPLETED` (recibida), se deberá registrar la entrada real con `POST /movements/input`.

---

### `GET /orders`
Lista todas las órdenes. Soporta filtrado por ubicación para la Vista Almacén.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Query params**:
  | Param | Tipo | Descripción |
  |---|---|---|
  | `locationId` | number | ❌ Si se provee, filtra órdenes donde esa ubicación es origen o destino |
- **Respuesta**: Array de órdenes con artículo, origen y destino relacionados, ordenadas por fecha descendente.
- **Relaciones**:
  - Sin `locationId`: vista de Admin/Manager con todas las órdenes.
  - Con `locationId`: Vista Almacén — el operador solo ve las órdenes que le corresponden.
  - Equivalente al filtro por `locationId` en `GET /movements`.

---

### `GET /orders/:qrCode`
Obtiene el detalle completo de una orden a partir de su código QR único.

- **Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Parámetros**: `qrCode` — string en formato `ORD-<UUID>` (ej. `ORD-3F2A1B...`).
- **Respuesta**: Objeto de orden con todas sus relaciones.
- **Errores comunes**: `404` si el QR no corresponde a ninguna orden.
- **Relaciones**:
  - Es el endpoint que consume la app móvil del almacenero al **escanear** el QR de una orden física.
  - El `qrCode` se obtiene de la respuesta de `POST /orders` (campo `qrUrl`).
  - Tras escanear y visualizar los datos, el operador puede confirmar la recepción disparando `PATCH /orders/:id/state`.

---

### `PATCH /orders/:id/state`
Actualiza el estado logístico de una orden.

- **Roles**: `ADMIN`, `MANAGER`
- **Parámetros**: `id` — ID numérico de la orden.
- **Body**:
  | Campo | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `status` | `MovementStatus` | ✅ | Nuevo estado |
  | `etaDays` | number | ⚠️ | **Obligatorio** cuando `status = APPROVED` |
- **Estados válidos de `MovementStatus`**:
  | Estado | Significado en una orden |
  |---|---|
  | `PENDING` | Recién creada, sin confirmar |
  | `APPROVED` | Confirmada por el proveedor — requiere `etaDays` |
  | `IN_PROGRESS` | En tránsito |
  | `COMPLETED` | Recibida físicamente |
  | `CANCELLED` | Cancelada |
- **Errores comunes**: `400` si la orden ya está `CANCELLED` o `COMPLETED`; `400` si falta `etaDays` al confirmar.
- **Relaciones**:
  - Flujo completo de una orden:
    ```
    POST /orders          → estado: PENDING
         ↓
    PATCH .../state       → APPROVED (+ etaDays)
         ↓
    PATCH .../state       → IN_PROGRESS
         ↓
    GET /orders/:qrCode   ← el almacenero escanea el QR al recibir
         ↓
    PATCH .../state       → COMPLETED
         ↓
    POST /movements/input → registra la entrada real al inventario
    ```
  - Al marcar una orden como `COMPLETED`, **no se actualiza el inventario automáticamente**. Es necesario registrar un `POST /movements/input` por separado para materializar la entrada.

---

## Diagrama de relaciones entre recursos

```
POST /auth/login ──────────────────────────────── Provee el JWT para todo lo demás
       │
       ▼
POST /users ────────────────────────────────────── Crea operadores que inician sesión

POST /locations ─────────────────────────────────── Define origen/destino de movimientos y órdenes
       │                                            └── GET /locations/:id/inventory (estado actual)
       │
POST /articles ──────────────────────────────────── Define el artículo a mover/ordenar
       │                └── POST /articles/:id/demand → Pronóstico de reabastecimiento
       │
GET /alerts ◄────────────── Inventario (articles × locations) por debajo del mínimo
       │
       ▼
POST /orders ────────────────────────────────────── Genera orden + QR
       │
       ├── GET /orders                  ← Vista Admin (todas) o Vista Almacén (?locationId)
       ├── GET /orders/:qrCode          ← Escaneo móvil
       └── PATCH /orders/:id/state      ← Avance del estado (PENDING→APPROVED→IN_PROGRESS→COMPLETED)
                                                         ↓
                                        POST /movements/input  ← Materializa la entrada en inventario
```
