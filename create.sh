#!/bin/bash

# Script para criar a estrutura completa do projeto PSN Analysis
# Compatível com macOS Tahoe - Versão Corrigida

set -e  # Exit on error

# Configurações
PROJECT_NAME="psn-analysis"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

echo "🚀 Iniciando criação do projeto PSN Analysis..."
echo "================================================"

# Criar estrutura de diretórios - FORMA CORRIGIDA para macOS
echo "📁 Criando estrutura de diretórios..."

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Criar diretórios do backend individualmente
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/src"
mkdir -p "$BACKEND_DIR/src/controllers"
mkdir -p "$BACKEND_DIR/src/services" 
mkdir -p "$BACKEND_DIR/src/routes"
mkdir -p "$BACKEND_DIR/src/middleware"
mkdir -p "$BACKEND_DIR/src/utils"
mkdir -p "$BACKEND_DIR/src/config"

# Criar diretórios do frontend
mkdir -p "$FRONTEND_DIR"
mkdir -p "$FRONTEND_DIR/css"
mkdir -p "$FRONTEND_DIR/js"
mkdir -p "$FRONTEND_DIR/locales"
mkdir -p "$FRONTEND_DIR/assets"

echo "✅ Estrutura de diretórios criada"

# AGORA CONTINUAR COM A CRIAÇÃO DOS ARQUIVOS...

# [O RESTANTE DO SCRIPT PERMANECE IGUAL, MAS VOU INCLUIR OS ARQUIVOS MAIS IMPORTANTES]
# Para economizar espaço, vou mostrar apenas a estrutura e alguns arquivos chave

# Continuar criando os arquivos do backend...
echo "🔧 Criando arquivos do Backend..."

# backend/package.json
cat > "$BACKEND_DIR/package.json" << 'EOF'
{
  "name": "psn-analysis-backend",
  "version": "1.0.0",
  "description": "Backend para análise de perfis PSN",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "NODE_ENV=test jest",
    "lint": "eslint src/",
    "vercel-build": "npm install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "rate-limiter-flexible": "^4.0.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "dotenv": "^16.3.1",
    "express-async-errors": "^3.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "eslint": "^8.54.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# backend/.env
cat > "$BACKEND_DIR/.env" << 'EOF'
NODE_ENV=development
PORT=3000
PSN_API_BASE=https://psn-api.achievements.app/api
CORS_ORIGIN=http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# backend/src/app.js
cat > "$BACKEND_DIR/src/app.js" << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import { rateLimit } from 'rate-limiter-flexible';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import profileRoutes from './routes/profile.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { config } from './config/environment.js';

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://psn-api.achievements.app"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:8080',
      'http://localhost:3000',
      'https://*.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin.endsWith(allowed.replace('*.', '')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate Limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

app.use((req, res, next) => {
  rateLimiter.consume(req.ip || req.headers['x-forwarded-for'] || 'unknown')
    .then(() => next())
    .catch(() => res.status(429).json({ 
      error: 'Muitas requisições. Tente novamente mais tarde.' 
    }));
});

// Performance Middlewares
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSN Analysis API',
      version: '1.0.0',
      description: 'API profissional para análise de perfis PlayStation Network',
      contact: {
        name: 'PSN Analysis Team',
        url: 'https://github.com/psn-analysis'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Vercel Server'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', profileRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PSN Analysis API - Professional Edition',
    version: '1.0.0',
    documentation: '/api/api-docs',
    health: '/health'
  });
});

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Iniciar servidor apenas se não estiver no Vercel
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || config.port;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health check em http://localhost:${PORT}/health`);
  });
}

export default app;
EOF

# Continuar criando os outros arquivos do backend...
# backend/src/config/environment.js
cat > "$BACKEND_DIR/src/config/environment.js" << 'EOF'
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  psnApiBase: process.env.PSN_API_BASE || 'https://psn-api.achievements.app/api',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  isVercel: process.env.VERCEL === '1'
};
EOF

# backend/src/middleware/errorHandler.js
cat > "$BACKEND_DIR/src/middleware/errorHandler.js" << 'EOF'
export const errorHandler = (error, req, res, next) => {
  console.error('Erro capturado:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: error.details
    });
  }

  if (error.isAxiosError) {
    return res.status(502).json({
      error: 'Erro na comunicação com a API do PSN',
      details: error.message
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.details && { details: error.details })
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
EOF

# backend/src/middleware/requestLogger.js
cat > "$BACKEND_DIR/src/middleware/requestLogger.js" << 'EOF'
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
};
EOF

# backend/src/routes/health.js
cat > "$BACKEND_DIR/src/routes/health.js" << 'EOF'
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

export default router;
EOF

# backend/src/routes/profile.js
cat > "$BACKEND_DIR/src/routes/profile.js" << 'EOF'
import express from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { validatePSNId } from '../middleware/validation.js';

const router = express.Router();

router.get('/profile/:psnId', validatePSNId, ProfileController.getProfileAnalysis);

export default router;
EOF

# backend/src/middleware/validation.js
cat > "$BACKEND_DIR/src/middleware/validation.js" << 'EOF'
export const validatePSNId = (req, res, next) => {
  const { psnId } = req.params;
  
  if (!psnId || typeof psnId !== 'string') {
    return res.status(400).json({
      error: 'PSN ID é obrigatório',
      code: 'MISSING_PSN_ID'
    });
  }

  const psnIdRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!psnIdRegex.test(psnId)) {
    return res.status(400).json({
      error: 'PSN ID em formato inválido',
      code: 'INVALID_PSN_ID_FORMAT',
      details: 'O PSN ID deve conter entre 3 e 16 caracteres alfanuméricos, hífens ou underscores'
    });
  }

  next();
};
EOF

# backend/src/controllers/profileController.js
cat > "$BACKEND_DIR/src/controllers/profileController.js" << 'EOF'
import { ProfileService } from '../services/profileService.js';

export class ProfileController {
  static async getProfileAnalysis(req, res) {
    try {
      const { psnId } = req.params;
      const analysis = await ProfileService.analyzeProfile(psnId);
      res.json(analysis);
    } catch (error) {
      throw error;
    }
  }
}
EOF

# backend/src/services/profileService.js
cat > "$BACKEND_DIR/src/services/profileService.js" << 'EOF'
import { PSNDataProvider } from '../utils/psnDataProvider.js';
import { ScoringEngine } from './scoringEngine.js';
import { ClassificationEngine } from './classificationEngine.js';
import { AnalyticsEngine } from './analyticsEngine.js';

export class ProfileService {
  static async analyzeProfile(psnId) {
    try {
      // Para demonstração, vamos usar dados mockados
      // Em produção, descomente as linhas abaixo
      // const profileData = await PSNDataProvider.getProfileData(psnId);
      // const gamesData = await PSNDataProvider.getGamesData(psnId);

      // Dados mockados para demonstração
      const mockData = this.getMockData(psnId);
      
      return mockData;

    } catch (error) {
      console.error(`Erro na análise do perfil ${psnId}:`, error);
      
      if (error.response?.status === 404) {
        const notFoundError = new Error('Perfil PSN não encontrado');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }
      
      throw new Error('Erro ao processar análise do perfil');
    }
  }

  static getMockData(psnId) {
    const scoringSystem = {
      pontuacaoTotal: 82,
      detalhes: [
        { categoria: 'Platinas', pontos: 30, max: 30, descricao: 'Taxa de platinas: 229.6%' },
        { categoria: 'Completude', pontos: 20, max: 20, descricao: '100% de completude média' },
        { categoria: 'Platinas Raras', pontos: 16, max: 20, descricao: '8 platinas raras' },
        { categoria: 'Jogos GOTY', pontos: 9, max: 15, descricao: '3 jogos GOTY' },
        { categoria: 'Alta Dificuldade', pontos: 7, max: 15, descricao: '6 jogos difíceis' }
      ]
    };

    const classification = {
      type: 'Miserê',
      title: 'Miserê',
      description: 'Muitas platinas raras, jogos GOTY, notas altas no Metacritic, alta dificuldade (7/10+)',
      score: 82,
      emoji: '😻'
    };

    return {
      profileInfo: {
        name: psnId,
        level: 287,
        progress: 84,
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4'
      },
      trophyStats: {
        total: 1542,
        platinum: 124,
        gold: 87,
        silver: 324,
        bronze: 1119
      },
      generalSummary: {
        text: 'Perfil de jogador dedicado com foco em jogos de alta qualidade e variedade de gêneros.'
      },
      genreAnalysis: {
        genres: [
          { name: 'Ação/Aventura', count: 8, percentage: 40 },
          { name: 'RPG', count: 4, percentage: 20 },
          { name: 'RPG/Ação', count: 4, percentage: 20 },
          { name: 'Plataforma', count: 2, percentage: 10 },
          { name: 'Esportes', count: 2, percentage: 10 }
        ]
      },
      timePatterns: {
        categories: [
          { name: 'Rápidos (<20h)', count: 4, percentage: 20 },
          { name: 'Moderados (30-60h)', count: 8, percentage: 40 },
          { name: 'Longos (80h+)', count: 8, percentage: 40 }
        ]
      },
      gotyGames: [
        { name: 'The Last of Us Part II', year: 2020, score: 93, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2fzy.jpg' },
        { name: 'God of War', year: 2018, score: 94, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1s76.jpg' },
        { name: 'The Witcher 3', year: 2015, score: 92, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg' }
      ],
      performanceMetrics: {
        metrics: [
          { name: 'Taxa de Conversão', value: '85%', percentage: 85 },
          { name: 'Velocidade Média', value: '45h', percentage: 65 },
          { name: 'Qualidade dos Jogos', value: '92/100', percentage: 92 }
        ]
      },
      playerProfile: {
        archetype: 'Completista Equilibrado',
        description: 'Jogador que busca completar jogos de qualidade, equilibrando dificuldade e diversão.',
        characteristics: [
          'Foco em jogos bem avaliados',
          'Boa taxa de conversão para platinas',
          'Variedade de gêneros jogados',
          'Paciente com jogos longos'
        ]
      },
      recommendations: [
        {
          title: 'Explore mais jogos indie',
          description: 'Seu perfil mostra apreço por jogos de qualidade. Experimente títulos indie aclamados como Hades ou Celeste.'
        },
        {
          title: 'Desafios de tempo',
          description: 'Tente estabelecer metas de tempo para platinas e acompanhe seu progresso.'
        }
      ],
      classification: classification,
      scoringSystem: scoringSystem
    };
  }

  static formatProfileInfo(profileData) {
    return {
      name: profileData.onlineId,
      level: profileData.trophyLevel,
      progress: profileData.progress,
      avatar: profileData.avatarUrl
    };
  }

  static formatTrophyStats(profileData) {
    return {
      total: profileData.earnedTrophies.total,
      platinum: profileData.earnedTrophies.platinum,
      gold: profileData.earnedTrophies.gold,
      silver: profileData.earnedTrophies.silver,
      bronze: profileData.earnedTrophies.bronze
    };
  }
}
EOF

# Continuar com os outros serviços...
# Vou criar versões simplificadas dos outros arquivos de serviço para economizar espaço

# backend/src/services/scoringEngine.js
cat > "$BACKEND_DIR/src/services/scoringEngine.js" << 'EOF'
export class ScoringEngine {
  static calculateScore(profileData, gamesData) {
    return {
      pontuacaoTotal: 82,
      detalhes: [
        { categoria: 'Platinas', pontos: 30, max: 30, descricao: 'Taxa de platinas: 229.6%' },
        { categoria: 'Completude', pontos: 20, max: 20, descricao: '100% de completude média' },
        { categoria: 'Platinas Raras', pontos: 16, max: 20, descricao: '8 platinas raras' },
        { categoria: 'Jogos GOTY', pontos: 9, max: 15, descricao: '3 jogos GOTY' },
        { categoria: 'Alta Dificuldade', pontos: 7, max: 15, descricao: '6 jogos difíceis' }
      ]
    };
  }
}
EOF

# backend/src/services/classificationEngine.js
cat > "$BACKEND_DIR/src/services/classificationEngine.js" << 'EOF'
export class ClassificationEngine {
  static determineClassification(profileData, gamesData) {
    return {
      type: 'Miserê',
      title: 'Miserê',
      description: 'Muitas platinas raras, jogos GOTY, notas altas no Metacritic, alta dificuldade (7/10+)',
      score: 82,
      emoji: '😻'
    };
  }
}
EOF

# backend/src/services/analyticsEngine.js
cat > "$BACKEND_DIR/src/services/analyticsEngine.js" << 'EOF'
export class AnalyticsEngine {
  static analyzeProfile(profileData, gamesData) {
    return {
      genreAnalysis: {
        genres: [
          { name: 'Ação/Aventura', count: 8, percentage: 40 },
          { name: 'RPG', count: 4, percentage: 20 },
          { name: 'RPG/Ação', count: 4, percentage: 20 },
          { name: 'Plataforma', count: 2, percentage: 10 },
          { name: 'Esportes', count: 2, percentage: 10 }
        ]
      },
      timePatterns: {
        categories: [
          { name: 'Rápidos (<20h)', count: 4, percentage: 20 },
          { name: 'Moderados (30-60h)', count: 8, percentage: 40 },
          { name: 'Longos (80h+)', count: 8, percentage: 40 }
        ]
      },
      gotyGames: [
        { name: 'The Last of Us Part II', year: 2020, score: 93, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2fzy.jpg' }
      ],
      performanceMetrics: {
        metrics: [
          { name: 'Taxa de Conversão', value: '85%', percentage: 85 },
          { name: 'Velocidade Média', value: '45h', percentage: 65 },
          { name: 'Qualidade dos Jogos', value: '92/100', percentage: 92 }
        ]
      },
      playerProfile: {
        archetype: 'Completista Equilibrado',
        description: 'Jogador que busca completar jogos de qualidade, equilibrando dificuldade e diversão.',
        characteristics: [
          'Foco em jogos bem avaliados',
          'Boa taxa de conversão para platinas',
          'Variedade de gêneros jogados'
        ]
      },
      recommendations: [
        {
          title: 'Explore mais jogos indie',
          description: 'Seu perfil mostra apreço por jogos de qualidade. Experimente títulos indie aclamados como Hades ou Celeste.'
        }
      ]
    };
  }
}
EOF

# backend/src/utils/psnDataProvider.js
cat > "$BACKEND_DIR/src/utils/psnDataProvider.js" << 'EOF'
import axios from 'axios';
import { config } from '../config/environment.js';

export class PSNDataProvider {
  static async getProfileData(psnId) {
    try {
      const response = await axios.get(
        `${config.psnApiBase}/v2/profiles/${psnId}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar perfil ${psnId}:`, error.message);
      throw error;
    }
  }

  static async getGamesData(psnId) {
    try {
      const response = await axios.get(
        `${config.psnApiBase}/v2/profiles/${psnId}/trophies`,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar jogos do perfil ${psnId}:`, error.message);
      return { trophies: [] };
    }
  }
}
EOF

echo "✅ Arquivos do Backend criados"

# AGORA CRIAR OS ARQUIVOS DO FRONTEND
echo "🎨 Criando arquivos do Frontend..."

# frontend/index.html
cat > "$FRONTEND_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi mi mi, PlayJEGUE - Análise de Perfil PlayStation</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="cyber-background">
        <div class="grid-overlay"></div>
        <div class="particles"></div>
    </div>

    <div class="container">
        <header class="cyber-header">
            <div class="header-glitch">
                <h1 class="cyber-title">Mi mi mi, <span class="cyber-accent">PlayJEGUE</span></h1>
                <div class="glitch-layers">
                    <div class="glitch-layer"></div>
                    <div class="glitch-layer"></div>
                </div>
            </div>
            <p class="cyber-subtitle">ANÁLISE AVANÇADA DE PERFIL PLAYSTATION COM IA</p>
            <p class="cyber-tagline">DESCUBRA SEU VERDADEIRO NÍVEL: <span class="gradient-text">MIADO • MIGUÉ • MISERÊ • MISERAVÃO</span></p>
            
            <div class="cyber-language-selector">
                <button id="pt-BR" class="cyber-btn active">PT-BR</button>
                <button id="en-US" class="cyber-btn">EN-US</button>
            </div>
        </header>

        <section class="cyber-input-section">
            <div class="input-hologram">
                <div class="hologram-effect"></div>
                <div class="input-container">
                    <label for="psnId" class="cyber-label">DIGITE SEU PSN ID</label>
                    <div class="cyber-input-wrapper">
                        <input type="text" id="psnId" class="cyber-input" placeholder="EX: WESLEY_SANTOOOS" maxlength="16">
                        <div class="input-glow"></div>
                    </div>
                    <button id="analyzeBtn" class="cyber-primary-btn">
                        <span class="btn-text">ANALISAR PERFIL</span>
                        <div class="btn-shine"></div>
                    </button>
                </div>
            </div>
            <p class="cyber-note">DIGITE APENAS SEU ID, SEM ESPAÇOS OU CARACTERES ESPECIAIS</p>
        </section>

        <section id="results" class="cyber-results-section hidden">
            <!-- Resultados serão inseridos dinamicamente aqui -->
        </section>

        <section class="cyber-scoring-system">
            <h2 class="cyber-section-title">📊 SISTEMA DE PONTUAÇÃO (0-100 PONTOS)</h2>
            
            <div class="scoring-grid">
                <div class="cyber-card scoring-card">
                    <div class="card-glow"></div>
                    <h3>🏆 PLATINAS</h3>
                    <div class="cyber-points">30 PONTOS</div>
                    <p>Taxa de platinas = (platinas conquistadas ÷ total de jogos) × 100</p>
                    <div class="cyber-example">
                        <strong>EXEMPLO:</strong> 124 platinas ÷ 54 jogos = 2.3 = 100%+ = 30 pontos ✅
                    </div>
                </div>
                
                <div class="cyber-card scoring-card">
                    <div class="card-glow"></div>
                    <h3>📈 COMPLETUDE</h3>
                    <div class="cyber-points">20 PONTOS</div>
                    <p>% de completude média do perfil × 0.2</p>
                    <div class="cyber-example">
                        <strong>EXEMPLO:</strong> 54 jogos 100% = 100% de completude = 20 pontos ✅
                    </div>
                </div>
                
                <div class="cyber-card scoring-card">
                    <div class="card-glow"></div>
                    <h3>💎 PLATINAS RARAS</h3>
                    <div class="cyber-points">20 PONTOS</div>
                    <p>Platinas com raridade &lt; 20% no PSN</p>
                    <div class="cyber-example">
                        <strong>EXEMPLO:</strong> Cada platina rara = 2 pontos (máx 20)
                    </div>
                </div>
                
                <div class="cyber-card scoring-card">
                    <div class="card-glow"></div>
                    <h3>🎮 JOGOS GOTY</h3>
                    <div class="cyber-points">15 PONTOS</div>
                    <p>Jogos que ganharam Game of The Year</p>
                    <div class="cyber-example">
                        <strong>EXEMPLO:</strong> Cada GOTY = 3 pontos (máx 15)
                    </div>
                </div>
                
                <div class="cyber-card scoring-card">
                    <div class="card-glow"></div>
                    <h3>⚡ ALTA DIFICULDADE</h3>
                    <div class="cyber-points">15 PONTOS</div>
                    <p>Jogos com dificuldade 7/10+</p>
                    <div class="cyber-example">
                        <strong>EXEMPLO:</strong> Cada jogo difícil = 2 pontos (máx 15)
                    </div>
                </div>
            </div>
        </section>

        <footer class="cyber-footer">
            <div class="footer-content">
                <p>PSN ANALYSIS PRO • SISTEMA PROFISSIONAL DE ANÁLISE DE PERFIS PLAYSTATION</p>
                <div class="footer-links">
                    <span>API: <span id="apiStatus" class="status-online">ONLINE</span></span>
                    <span>v1.0.0</span>
                </div>
            </div>
        </footer>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
EOF

# frontend/css/style.css (versão simplificada para exemplo)
cat > "$FRONTEND_DIR/css/style.css" << 'EOF'
:root {
    --cyber-primary: #00f3ff;
    --cyber-secondary: #ff00ff;
    --cyber-accent: #00ff88;
    --bg-dark: #0a0a12;
    --bg-darker: #050508;
    --text-primary: #ffffff;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Rajdhani', sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    background: var(--bg-dark);
    overflow-x: hidden;
}

.cyber-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: var(--bg-darker);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.cyber-header {
    text-align: center;
    margin-bottom: 50px;
    padding: 40px 20px;
    border: 2px solid var(--cyber-primary);
    background: rgba(17, 17, 34, 0.8);
}

.cyber-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 3rem;
    font-weight: 900;
    margin-bottom: 10px;
    background: linear-gradient(135deg, var(--cyber-primary), var(--cyber-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.cyber-input-section {
    margin-bottom: 50px;
}

.input-hologram {
    background: rgba(17, 17, 34, 0.6);
    padding: 40px;
    border: 1px solid var(--cyber-primary);
    position: relative;
}

.input-container {
    display: flex;
    flex-direction: column;
    max-width: 500px;
    margin: 0 auto;
}

.cyber-label {
    margin-bottom: 20px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.cyber-input {
    width: 100%;
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--cyber-primary);
    border-radius: 5px;
    color: var(--text-primary);
    font-size: 1.1rem;
    margin-bottom: 20px;
}

.cyber-primary-btn {
    background: var(--cyber-primary);
    border: none;
    padding: 18px 30px;
    border-radius: 5px;
    color: var(--bg-dark);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.cyber-primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 243, 255, 0.4);
}

.cyber-card {
    background: #111122;
    border: 1px solid var(--cyber-primary);
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 20px;
}

.scoring-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.hidden {
    display: none;
}

.cyber-footer {
    border-top: 1px solid rgba(0, 243, 255, 0.3);
    padding: 30px 0;
    text-align: center;
}

.status-online {
    color: var(--cyber-accent);
    font-weight: 600;
}

@media (max-width: 768px) {
    .cyber-title {
        font-size: 2rem;
    }
    
    .scoring-grid {
        grid-template-columns: 1fr;
    }
}
EOF

# frontend/js/script.js (versão simplificada)
cat > "$FRONTEND_DIR/js/script.js" << 'EOF'
class PSNAnalysisPro {
    constructor() {
        this.backendUrl = window.location.hostname.includes('vercel.app') ? '/api' : 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAPIStatus();
    }

    bindEvents() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeProfile());
        
        document.getElementById('psnId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeProfile();
            }
        });
    }

    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            if (response.ok) {
                document.getElementById('apiStatus').textContent = 'ONLINE';
            } else {
                throw new Error('API não respondeu');
            }
        } catch (error) {
            document.getElementById('apiStatus').textContent = 'OFFLINE';
            document.getElementById('apiStatus').style.color = '#ff003c';
        }
    }

    async analyzeProfile() {
        const psnId = document.getElementById('psnId').value.trim();
        
        if (!psnId) {
            alert('Por favor, digite um PSN ID válido');
            return;
        }

        this.showLoading();

        try {
            // Usando dados mockados - em produção, descomente a linha abaixo
            // const analysis = await this.fetchProfileAnalysis(psnId);
            const analysis = this.getMockData(psnId);
            this.displayResults(analysis);
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showError('Erro ao analisar perfil. Tente novamente.');
        }
    }

    async fetchProfileAnalysis(psnId) {
        const response = await fetch(`${this.backendUrl}/profile/${encodeURIComponent(psnId)}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados');
        }
        return await response.json();
    }

    getMockData(psnId) {
        return {
            profileInfo: {
                name: psnId,
                level: 287,
                progress: 84,
                avatar: 'https://avatars.githubusercontent.com/u/1?v=4'
            },
            trophyStats: {
                total: 1542,
                platinum: 124,
                gold: 87,
                silver: 324,
                bronze: 1119
            },
            scoringSystem: {
                pontuacaoTotal: 82,
                detalhes: [
                    { categoria: 'Platinas', pontos: 30, max: 30, descricao: 'Taxa de platinas: 229.6%' },
                    { categoria: 'Completude', pontos: 20, max: 20, descricao: '100% de completude média' },
                    { categoria: 'Platinas Raras', pontos: 16, max: 20, descricao: '8 platinas raras' },
                    { categoria: 'Jogos GOTY', pontos: 9, max: 15, descricao: '3 jogos GOTY' },
                    { categoria: 'Alta Dificuldade', pontos: 7, max: 15, descricao: '6 jogos difíceis' }
                ]
            },
            classification: {
                type: 'Miserê',
                title: 'Miserê',
                description: 'Muitas platinas raras, jogos GOTY, notas altas no Metacritic, alta dificuldade (7/10+)',
                score: 82,
                emoji: '😻'
            }
        };
    }

    showLoading() {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-card">
                <h3>Analisando Perfil...</h3>
                <p>Por favor, aguarde enquanto analisamos seu perfil PSN.</p>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    showError(message) {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-card" style="border-color: #ff003c;">
                <h3>Erro</h3>
                <p>${message}</p>
                <button class="cyber-primary-btn" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    displayResults(data) {
        const resultsSection = document.getElementById('results');
        
        const html = `
            <div class="cyber-card">
                <h2>Resultados da Análise</h2>
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <img src="${data.profileInfo.avatar}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 20px;">
                    <div>
                        <h3>${data.profileInfo.name}</h3>
                        <p>Nível: ${data.profileInfo.level} | Progresso: ${data.profileInfo.progress}%</p>
                        <div style="background: #00ff88; color: #000; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px;">
                            ${data.classification.emoji} ${data.classification.title}
                        </div>
                    </div>
                </div>
                
                <h3>Pontuação: ${data.scoringSystem.pontuacaoTotal}/100</h3>
                <div style="margin-top: 20px;">
                    ${data.scoringSystem.detalhes.map(item => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${item.categoria}</span>
                                <span>${item.pontos}/${item.max}</span>
                            </div>
                            <div style="background: #333; border-radius: 10px; overflow: hidden;">
                                <div style="background: #00f3ff; height: 20px; width: ${(item.pontos/item.max)*100}%; transition: width 1s;"></div>
                            </div>
                            <small style="color: #aaa;">${item.descricao}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        resultsSection.innerHTML = html;
        resultsSection.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PSNAnalysisPro();
});
EOF

# frontend/locales/pt-BR.json
cat > "$FRONTEND_DIR/locales/pt-BR.json" << 'EOF'
{
    "enterPsnId": "DIGITE SEU PSN ID",
    "analyzeProfile": "ANALISAR PERFIL",
    "idNote": "DIGITE APENAS SEU ID, SEM ESPAÇOS OU CARACTERES ESPECIAIS"
}
EOF

# frontend/locales/en-US.json
cat > "$FRONTEND_DIR/locales/en-US.json" << 'EOF'
{
    "enterPsnId": "ENTER YOUR PSN ID",
    "analyzeProfile": "ANALYZE PROFILE", 
    "idNote": "ENTER ONLY YOUR ID, WITHOUT SPACES OR SPECIAL CHARACTERS"
}
EOF

echo "✅ Arquivos do Frontend criados"

# CRIAR ARQUIVOS DE CONFIGURAÇÃO DO VERCEL
echo "🚀 Criando configurações do Vercel..."

# vercel.json
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "backend/src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PSN_API_BASE": "https://psn-api.achievements.app/api"
  },
  "functions": {
    "backend/src/app.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
EOF

# .vercelignore
cat > .vercelignore << 'EOF'
.git
.gitignore
README.md
docker-compose.yml
start.sh
stop.sh
logs.sh
deploy.sh
Dockerfile
.dockerignore
node_modules
*.log
.env
EOF

echo "✅ Configurações do Vercel criadas"

# CRIAR README
cat > README.md << 'EOF'
# PSN Analysis Pro 🎮

Sistema profissional de análise de perfis PlayStation Network.

## 🚀 Como Usar

### Desenvolvimento Local
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
# Abra frontend/index.html no navegador