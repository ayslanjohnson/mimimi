#!/bin/bash

echo "🛑 Parando PSN Analysis Pro..."

if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo "✅ Serviços parados"
