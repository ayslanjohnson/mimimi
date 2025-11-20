# Stage 1: Build
FROM node:latest AS builder

WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./
COPY package-lock.json* ./

# Instala todas as dependências (incluindo devDependencies)
RUN npm clean-install

# Copia código fonte e faz build
COPY . .
RUN npm run docker:build

# Stage 2: Production
FROM node:latest AS production

WORKDIR /app

# Copia apenas produção dependencies
COPY package*.json ./
RUN npm clean-install --only=production

# Copia arquivos built do stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "src/server.js"]