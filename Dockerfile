# Usamos una imagen ligera de Node
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos solo los archivos de dependencias primero (optimiza el caché de Docker)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto de NestJS (genera la carpeta /dist)
RUN npm run build

# Exponemos el puerto interno del contenedor
EXPOSE 3000

# Comando para ejecutar la aplicación en producción
CMD ["node", "dist/main"]