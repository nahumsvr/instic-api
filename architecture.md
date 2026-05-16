# Architecture (El Mapa)

Este documento describe la arquitectura general y el stack tecnológico utilizado en la API de Instic.

## Stack Tecnológico

- **Framework**: [NestJS](https://nestjs.com/) - Framework progresivo de Node.js para construir aplicaciones eficientes y escalables del lado del servidor.
- **Runtime**: [node](https://nodejs.org/) - Utilizado como entorno de ejecución rápido.
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) - Sistema de base de datos relacional robusto y de código abierto.
- **ORM**: [TypeORM](https://typeorm.io/) - Framework ORM utilizado para interactuar con la base de datos PostgreSQL mediante TypeScript.
- **Validación**: `class-validator` y `class-transformer` - Para la validación y transformación de datos en los DTOs (Data Transfer Objects).
- **Autenticación**: JWT (JSON Web Tokens) - Utilizado para manejar las sesiones de manera _stateless_ a través del módulo `@nestjs/jwt`.
- **Encriptación**: [Bcrypt](https://www.npmjs.com/package/bcrypt) - Utilizado para el hasheo de contraseñas.

## Arquitectura General

El proyecto sigue una **Arquitectura Modular** promovida por NestJS, estructurando la lógica de negocio por dominios (ej. `AuthModule`, `UsersModule`). El flujo de datos estándar es el siguiente:

1. **Cliente / Interfaz**: Realiza peticiones HTTP REST a los endpoints de la API.
2. **Guards (Seguridad)**:
   - `JwtAuthGuard`: Valida que el token provisto en la petición sea válido.
   - `RolesGuard`: Valida que el rol del usuario autenticado tenga los permisos necesarios para acceder a la ruta.
3. **Controllers**: Reciben la petición HTTP validada, recogen los DTOs y delegan la ejecución al servicio correspondiente.
4. **Services**: Contienen la lógica de negocio de la aplicación.
5. **Entities & Repositories**: Las entidades mapean clases TypeScript a tablas en la base de datos y los repositorios (provistos por TypeORM) ejecutan las sentencias SQL hacia PostgreSQL.

## Estructura de Directorios Principal

```text
src/
├── app.module.ts          # Módulo raíz que importa y configura globalmente todo.
├── auth/                  # Módulo de Autenticación (Login, Logout, Guards, Decorators).
│   ├── decorators/        # Decoradores personalizados (ej. @Roles).
│   ├── dto/               # DTOs para inicio de sesión.
│   ├── guards/            # Guards para protección de rutas (JWT, Roles).
│   ├── auth.controller.ts # Endpoints de Auth.
│   └── auth.service.ts    # Lógica de Auth y firma de Tokens.
└── users/                 # Módulo de Usuarios.
│   ├── dto/               # DTOs de creación y actualización.
│   ├── entities/          # Entidad TypeORM de Usuario.
│   ├── enums/             # Enums utilizados (ej. Roles).
│   ├── users.controller.ts# Endpoints CRUD de Usuarios.
│   └── users.service.ts   # Lógica CRUD y búsqueda de Usuarios.
└── locations/             # Módulo de Ubicaciones (Gestión de Tiendas y Almacenes).
│   ├── dto/               # DTOs de creación, actualización y respuestas.
│   ├── entities/          # Entidad TypeORM de Ubicación.
│   ├── enums/             # Enums utilizados (ej. Tipo de Ubicación, Estado).
│   ├── locations.controller.ts # Endpoints de Ubicaciones y sus inventarios.
│   └── locations.service.ts    # Lógica de negocio de Ubicaciones.
├── inventory/             # Módulo de Inventario.
│   ├── entities/          # Entidad TypeORM de Inventario.
│   ├── inventory.controller.ts # Endpoints CRUD de Inventario.
│   └── inventory.service.ts    # Lógica CRUD de Inventario.
└── articles/              # Módulo de Artículos.
    ├── entities/          # Entidad TypeORM de Artículo.
    ├── articles.controller.ts # Endpoints CRUD de Artículos.
    └── articles.service.ts    # Lógica CRUD de Artículos.
```
