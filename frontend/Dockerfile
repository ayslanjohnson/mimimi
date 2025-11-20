# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./
COPY package-lock.json* ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine

# Copia configuração customizada do nginx se existir
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos built do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]