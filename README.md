# Instic API

API REST para la gestión de inventario, movimientos de mercancía y reabastecimiento de la plataforma **Instic**. Construida con NestJS + TypeORM sobre PostgreSQL.

---

## Stack tecnológico

| Capa          | Tecnología                              |
| ------------- | --------------------------------------- |
| Framework     | [NestJS](https://nestjs.com/) v11       |
| Runtime       | Node.js                                 |
| Base de datos | PostgreSQL                              |
| ORM           | [TypeORM](https://typeorm.io/) v0.3     |
| Autenticación | JWT (`@nestjs/jwt`)                     |
| Encriptación  | bcrypt                                  |
| Validación    | `class-validator` + `class-transformer` |
| Lenguaje      | TypeScript estricto                     |

---

## Requisitos previos

- **Node.js** ≥ 18
- **Docker** (recomendado para la base de datos)
- **NestJS CLI** — `npm i -g @nestjs/cli`

---

## Configuración inicial

### 1. Levantar la base de datos con Docker

Crea y arranca el contenedor de PostgreSQL:

```bash
docker run --name instic-db \
     -e POSTGRES_PASSWORD=admin \
     -e POSTGRES_USER=admin \ // por defecto es postgres
     -e POSTGRES_DB=instic_db \
     -p 5432:5432 \
     -v instic_data:/var/lib/postgresql \
     -d postgres
```

> El volumen `instic_data` persiste los datos aunque el contenedor se detenga o elimine.

Para detener / reiniciar el contenedor:

```bash
docker stop instic
docker start instic
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con los mismos valores usados en el contenedor:

```env
POSTGRES_PASSWORD=admin
POSTGRES_DB=instic_db
DB_PORT=5432
JWT_SECRET=tu_secreto_jwt
```

> Las tablas se crean/actualizan automáticamente al iniciar gracias a `synchronize: true` (solo en desarrollo).

---

## Correr el proyecto

```bash
# Modo desarrollo (watch)
npm run start:dev

# Modo producción
npm run start:prod

# Build
npm run build
```

El servidor levanta por defecto en `http://localhost:3000`.

---

## Scripts disponibles

| Script               | Descripción                               |
| -------------------- | ----------------------------------------- |
| `npm run start:dev`  | Inicia en modo watch (recarga automática) |
| `npm run start:prod` | Ejecuta el build de producción            |
| `npm run build`      | Compila TypeScript a `dist/`              |
| `npm run lint`       | Ejecuta ESLint con auto-fix               |
| `npm run format`     | Formatea el código con Prettier           |
| `npm run test`       | Ejecuta los tests unitarios con Jest      |
| `npm run test:cov`   | Tests con reporte de cobertura            |
| `npm run test:e2e`   | Tests end-to-end                          |

---

## Arquitectura del proyecto

La API sigue una **Arquitectura Modular** de NestJS. Cada dominio de negocio es un módulo independiente. El flujo de una petición es:

```
Cliente → JwtAuthGuard → RolesGuard → Controller → Service → TypeORM → PostgreSQL
```

### Módulos

| Módulo            | Prefijo               | Descripción                                        |
| ----------------- | --------------------- | -------------------------------------------------- |
| `AuthModule`      | `/auth`               | Login, logout y firma de JWT                       |
| `UsersModule`     | `/users`              | CRUD de usuarios y gestión de roles                |
| `LocationsModule` | `/locations`          | Tiendas y almacenes, inventario por ubicación      |
| `InventoryModule` | —                     | Entidad central de stock (usada por otros módulos) |
| `ArticlesModule`  | `/articles`           | Catálogo de artículos, demanda y pronósticos       |
| `MovementsModule` | `/movements`          | Entradas, salidas y transferencias de mercancía    |
| `OrdersModule`    | `/orders` & `/alerts` | Órdenes de reabastecimiento y alertas de stock     |

### Estructura de directorios

```
src/
├── app.module.ts
├── auth/
│   ├── decorators/        # @Roles()
│   ├── dto/               # LoginDto
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   ├── auth.controller.ts
│   └── auth.service.ts
├── users/
│   ├── dto/               # CreateUserDto, UpdateUserDto
│   ├── entities/          # User entity
│   ├── enums/             # Role (ADMIN | MANAGER | EMPLOYEE)
│   ├── users.controller.ts
│   └── users.service.ts
├── locations/
│   ├── dto/               # CreateLocationDto, UpdateStorageCostDto
│   ├── entities/          # Location entity
│   ├── enums/             # TipoUbicacion, EstadoUbicacion
│   ├── locations.controller.ts
│   └── locations.service.ts
├── inventory/
│   ├── entities/          # Inventory entity (article × location)
│   ├── inventory.controller.ts
│   └── inventory.service.ts
├── articles/
│   ├── dto/               # CreateArticleDto, QueryArticleDto, RegisterDemandDto
│   ├── entities/          # Article, Demand
│   ├── articles.controller.ts
│   └── articles.service.ts
├── movements/
│   ├── dto/               # MovementInputDto, OutputDto, TransferDto, QueryMovementDto...
│   ├── entities/          # Movement entity
│   ├── enums/             # MovementStatus (compartido con orders), MovementType
│   ├── movements.controller.ts
│   └── movements.service.ts
└── orders/
    ├── dto/               # CreateOrderDto, UpdateOrderStateDto
    ├── entities/          # Order entity (qr_code, eta_days, estado)
    ├── orders.controller.ts  # también expone GET /alerts
    └── orders.service.ts
```

---

## Seguridad

- Todas las rutas (excepto `POST /auth/login`) requieren el header:
  ```
  Authorization: Bearer <token>
  ```
- El token JWT se obtiene en `POST /auth/login`.
- Los roles disponibles son `ADMIN`, `MANAGER` y `EMPLOYEE`. Cada endpoint declara explícitamente qué roles tienen acceso.

---

## Resumen de endpoints

> Para la documentación completa de cada endpoint (body, parámetros, errores, relaciones) ver [`endpoints.md`](./endpoints.md).

### Autenticación

| Método | Ruta           | Acceso      | Descripción                  |
| ------ | -------------- | ----------- | ---------------------------- |
| `POST` | `/auth/login`  | Público     | Inicia sesión y devuelve JWT |
| `POST` | `/auth/logout` | Autenticado | Cierra la sesión activa      |

### Usuarios

| Método   | Ruta         | Roles | Descripción              |
| -------- | ------------ | ----- | ------------------------ |
| `POST`   | `/users`     | ADMIN | Crea un usuario          |
| `GET`    | `/users`     | ADMIN | Lista todos los usuarios |
| `GET`    | `/users/:id` | ADMIN | Detalle de un usuario    |
| `PATCH`  | `/users/:id` | ADMIN | Actualiza un usuario     |
| `DELETE` | `/users/:id` | ADMIN | Elimina un usuario       |

### Ubicaciones

| Método  | Ruta                          | Roles          | Descripción                           |
| ------- | ----------------------------- | -------------- | ------------------------------------- |
| `POST`  | `/locations`                  | ADMIN, MANAGER | Crea una ubicación (tienda o almacén) |
| `GET`   | `/locations`                  | Todos          | Lista todas las ubicaciones           |
| `GET`   | `/locations/:id/inventory`    | Todos          | Inventario actual de una ubicación    |
| `PATCH` | `/locations/:id/storage-cost` | ADMIN, MANAGER | Actualiza el costo de almacenamiento  |

### Artículos

| Método   | Ruta                       | Roles          | Descripción                                      |
| -------- | -------------------------- | -------------- | ------------------------------------------------ |
| `POST`   | `/articles`                | ADMIN, MANAGER | Registra un artículo (con stock config opcional) |
| `GET`    | `/articles`                | ADMIN, MANAGER | Lista artículos con filtros                      |
| `GET`    | `/articles/:id`            | ADMIN, MANAGER | Detalle con inventario y demanda histórica       |
| `PATCH`  | `/articles/:id`            | ADMIN, MANAGER | Actualiza atributos del artículo                 |
| `DELETE` | `/articles/:id`            | ADMIN, MANAGER | Marca el artículo como discontinuado             |
| `PATCH`  | `/articles/:id/reactivate` | ADMIN, MANAGER | Reactiva un artículo discontinuado               |
| `POST`   | `/articles/:id/demand`     | ADMIN, MANAGER | Registra demanda mensual y recalcula pronóstico  |

### Movimientos

| Método  | Ruta                    | Roles                    | Descripción                                  |
| ------- | ----------------------- | ------------------------ | -------------------------------------------- |
| `POST`  | `/movements/input`      | ADMIN, MANAGER, EMPLOYEE | Registra una entrada de mercancía            |
| `POST`  | `/movements/output`     | ADMIN, MANAGER, EMPLOYEE | Registra una salida de mercancía             |
| `POST`  | `/movements/transfer`   | ADMIN, MANAGER, EMPLOYEE | Registra una transferencia entre ubicaciones |
| `GET`   | `/movements`            | ADMIN, MANAGER, EMPLOYEE | Lista movimientos con filtros                |
| `POST`  | `/movements/:id/cancel` | ADMIN, MANAGER           | Cancela un movimiento y revierte inventario  |
| `PATCH` | `/movements/:id/status` | ADMIN, MANAGER, EMPLOYEE | Actualiza el estado de un movimiento         |

### Órdenes y Alertas

| Método  | Ruta                | Roles                    | Descripción                                      |
| ------- | ------------------- | ------------------------ | ------------------------------------------------ |
| `GET`   | `/alerts`           | ADMIN, MANAGER, EMPLOYEE | Alertas activas clasificadas por severidad       |
| `POST`  | `/orders`           | ADMIN, MANAGER           | Crea una orden de reabastecimiento (devuelve QR) |
| `GET`   | `/orders`           | ADMIN, MANAGER, EMPLOYEE | Lista órdenes (filtrable por `?locationId=`)     |
| `GET`   | `/orders/:qrCode`   | ADMIN, MANAGER, EMPLOYEE | Detalle de una orden escaneada por QR            |
| `PATCH` | `/orders/:id/state` | ADMIN, MANAGER           | Actualiza el estado logístico de la orden        |

---

## Flujo de reabastecimiento

```
1. GET /alerts               ← detectar artículo bajo mínimo
         ↓
2. POST /orders              ← generar orden + QR (estado: PENDING)
         ↓
3. PATCH /orders/:id/state   ← confirmar con proveedor (APPROVED + etaDays)
         ↓
4. PATCH /orders/:id/state   ← marcar en tránsito (IN_PROGRESS)
         ↓
5. GET /orders/:qrCode       ← almacenero escanea QR al recibir
         ↓
6. PATCH /orders/:id/state   ← marcar como recibida (COMPLETED)
         ↓
7. POST /movements/input     ← registrar la entrada real al inventario
```

---

## Estados compartidos (`MovementStatus`)

Tanto los movimientos como las órdenes usan el mismo enum:

| Estado        | Significado                                            |
| ------------- | ------------------------------------------------------ |
| `PENDING`     | Creado, pendiente de aprobación                        |
| `APPROVED`    | Aprobado / confirmado (en órdenes: requiere `etaDays`) |
| `IN_PROGRESS` | En proceso / en tránsito                               |
| `COMPLETED`   | Finalizado — aplica cambios en inventario              |
| `CANCELLED`   | Cancelado — revierte inventario si estaba `COMPLETED`  |

---

## Documentación adicional

| Archivo                                | Descripción                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| [`architecture.md`](./architecture.md) | Stack tecnológico y estructura de directorios                                          |
| [`endpoints.md`](./endpoints.md)       | Referencia completa de todos los endpoints, con body, parámetros, errores y relaciones |
| [`rules.md`](./rules.md)               | Reglas de desarrollo y estándares de código                                            |
