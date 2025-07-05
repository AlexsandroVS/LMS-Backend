FROM node:20-slim

# Instalar LibreOffice y dependencias necesarias
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    libreoffice-math \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copia archivos de dependencias primero para caché
COPY package*.json ./

# Instala dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copia el resto de los archivos
COPY --chown=appuser:appuser . .

# Crear directorios necesarios y establecer permisos
RUN mkdir -p uploads documents && \
    chown -R appuser:appuser uploads documents

# Cambiar al usuario no-root
USER appuser

# Puerto expuesto
EXPOSE 5000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicio
CMD ["node", "src/app.js"]