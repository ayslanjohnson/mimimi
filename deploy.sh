#!/bin/bash

# Script de deploy para produção
echo "🚀 Deploying PSN Analysis Pro to production..."

# Pull latest changes
git pull origin main

# Rebuild and restart services
if command -v docker-compose &> /dev/null; then
    docker-compose down
    docker-compose up --build -d
else
    docker compose down
    docker compose up --build -d
fi

# Run database migrations (if any)
# npx sequelize-cli db:migrate

echo "✅ Deployment completed successfully"
