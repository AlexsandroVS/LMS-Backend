FROM node:20-slim

WORKDIR /app

# Copia archivos de dependencias primero para caché
COPY package*.json ./

# Instala dependencias de producción (incluyendo mariadb/mysql2)
RUN npm install --omit=dev

# Copia el resto de los archivos
COPY . .

# Puerto expuesto
EXPOSE 5000

# Comando de inicio
CMD ["node", "src/app.js"]