#!/bin/bash

echo "🎮 Iniciando PSN Analysis Pro - Edição Professional..."
echo "======================================================"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale Docker primeiro."
    echo "📥 Download: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está disponível."
    exit 1
fi

echo "✅ Docker encontrado: $(docker --version)"

# Verificar arquivos de configuração
if [ ! -f backend/.env ]; then
    echo "📝 Criando arquivo .env a partir do exemplo..."
    cp backend/.env.example backend/.env
fi

# Construir e iniciar containers
echo "🚀 Construindo e iniciando containers Docker..."

if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 10

# Verificar saúde dos serviços
echo "🔍 Verificando saúde dos serviços..."

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está saudável"
else
    echo "❌ Backend não está respondendo"
fi

if curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Frontend está saudável"
else
    echo "❌ Frontend não está respondendo"
fi

echo ""
echo "🎉 PSN Analysis Pro iniciado com sucesso!"
echo "=========================================="
echo ""
echo "🌐 Frontend:      http://localhost:8080"
echo "🔧 Backend API:   http://localhost:3000"
echo "📚 API Docs:      http://localhost:3000/api-docs"
echo "❤️  Health Check: http://localhost:3000/health"
echo ""
echo "🛑 Para parar:    ./stop.sh"
echo "📊 Para logs:     ./logs.sh"
echo ""
