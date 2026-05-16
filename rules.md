# Rules (Las Restricciones)

Este documento establece las reglas estrictas de código que deben seguirse durante el desarrollo de la API de Instic. El objetivo es mantener una base de código limpia, escalable y libre de errores.

## 1. Tipado y TypeScript
- **TypeScript Estricto**: Se debe utilizar TypeScript en modo estricto siempre. No está permitido el uso del tipo `any`.
- **Interfaces y Tipos**: Define interfaces o DTOs explícitos para cualquier objeto de entrada o salida.

## 2. Acceso a Datos
- **Uso Exclusivo de TypeORM**: Toda la interacción con la base de datos debe realizarse a través de TypeORM (Repositorios, QueryBuilders o métodos nativos del ORM). No se permite el uso directo de Prisma u otros ORMs en este proyecto, ni escribir consultas SQL en texto plano a menos que sea estrictamente necesario y justificado por rendimiento.

## 3. Validación de Datos
- **Uso de `class-validator` y `class-transformer`**: Todos los datos entrantes (cuerpos de solicitudes, parámetros y queries) deben validarse utilizando Data Transfer Objects (DTOs) decorados con las reglas de validación de `class-validator`.
- **ValidationPipe**: La API debe tener habilitado el `ValidationPipe` global para rechazar automáticamente cualquier petición que no cumpla con los esquemas de los DTOs.

## 4. Manejo de Excepciones
- **Excepciones de NestJS**: Se deben usar siempre las excepciones integradas de NestJS (ej. `NotFoundException`, `UnauthorizedException`, `BadRequestException`) en lugar de arrojar errores nativos genéricos (`throw new Error()`).
- **Manejo Centralizado**: Cualquier excepción imprevista debe ser capturada y formateada adecuadamente, evitando exponer el *stack trace* o detalles sensibles de la base de datos al cliente.

## 5. Estructura y Estilo
- **Módulos Independientes**: La lógica de negocio debe separarse por dominios o recursos (ej. un módulo para Auth, otro para Usuarios). No acoplar lógica que no corresponde al módulo.
- **Inyección de Dependencias**: Todo servicio o clase de lógica debe inyectarse a través de los constructores. No instanciar clases de servicio manualmente usando `new`.
- **Linter y Formateador**: El código debe cumplir con las reglas de ESLint y Prettier configuradas en el proyecto. Ejecuta siempre el formateador antes de cada commit.

## 6. Seguridad
- **Protección de Rutas**: Todas las rutas deben estar protegidas de acuerdo a su propósito. Si es privada, debe requerir `JwtAuthGuard`. Si requiere permisos específicos, debe usar `RolesGuard` con el decorador `@Roles()`.
- **Protección de Datos Sensibles**: Nunca exponer contraseñas (ni siquiera sus hashes), tokens ni secretos en las respuestas de la API.

## 7. Controladores vs Servicios
- **Controladores Limpios**: Los controladores solo deben encargarse de recibir la petición HTTP, extraer parámetros o body, llamar al servicio correspondiente, y retornar la respuesta.
- **Lógica en Servicios**: Toda la lógica de negocio, cálculos y acceso a repositorios debe residir única y exclusivamente dentro de los archivos `*.service.ts`.
