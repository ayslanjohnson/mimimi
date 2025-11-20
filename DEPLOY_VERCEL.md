# 🚀 Deploy no Vercel - PSN Analysis Pro

Este guia explica como fazer deploy da aplicação PSN Analysis Pro no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- GitHub account (recomendado)
- Node.js 18+ (para desenvolvimento local)

## 🔧 Configuração

### 1. Estrutura do Projeto para Vercel

O projeto está configurado com:
- **Frontend**: Pasta `frontend` (arquivos estáticos)
- **Backend**: Pasta `backend` (API Node.js)
- **Configuração Vercel**: `vercel.json`

### 2. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel do Vercel:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `PSN_API_BASE` | `https://psn-api.achievements.app/api` | API do PSN |
| `CORS_ORIGIN` | Sua URL do Vercel | Domínio permitido para CORS |

### 3. Deploy Automático (Recomendado)

1. **Conecte seu repositório GitHub**
   - Vá para [vercel.com](https://vercel.com)
   - Clique "New Project"
   - Importe seu repositório GitHub

2. **Configure as variáveis de ambiente**
   - No painel do projeto no Vercel
   - Settings → Environment Variables
   - Adicione as variáveis listadas acima

3. **Deploy**
   - O Vercel detectará automaticamente a configuração
   - O deploy será feito automaticamente a cada push no main

### 4. Deploy Manual

```bash
# Instale o Vercel CLI
npm i -g vercel

# Faça login
vercel login

# No diretório do projeto
vercel

# Siga as instruções no terminal
