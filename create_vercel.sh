# Adicionar ao script existente - criar arquivos de configuração do Vercel

# Criar vercel.json para configuração do projeto
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
    "PSN_API_BASE": "https://psn-api.achievements.app/api",
    "CORS_ORIGIN": "https://your-domain.vercel.app"
  },
  "functions": {
    "backend/src/app.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
EOF

# Criar .vercelignore
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
.env.local
.env.production.local
.env.development.local
EOF

# Criar configuração específica para o backend no Vercel
cat > backend/vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/app.js"
    }
  ],
  "functions": {
    "src/app.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
EOF

# Atualizar package.json do backend para Vercel
cat > backend/package.json << 'EOF'
{
  "name": "psn-analysis-backend",
  "version": "1.0.0",
  "description": "Backend profissional para análise de perfis PSN",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "NODE_ENV=test jest",
    "lint": "eslint src/",
    "vercel-build": "npm install",
    "docker:build": "docker build -t psn-analysis-backend .",
    "docker:run": "docker run -p 3000:3000 psn-analysis-backend"
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
    "eslint": "^8.54.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Criar .env.production para configurações de produção
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=3000
PSN_API_BASE=https://psn-api.achievements.app/api
CORS_ORIGIN=https://your-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Atualizar o app.js do backend para funcionar no Vercel
cat > backend/src/app.js << 'EOF'
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
    // Permitir requisições sem origin (como mobile apps ou curl)
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

# Atualizar o config/environment.js para Vercel
cat > backend/src/config/environment.js << 'EOF'
import dotenv from 'dotenv';

// Carregar .env apenas em desenvolvimento local
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

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['PSN_API_BASE'];
if (!config.isVercel) {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`Variável de ambiente obrigatória ${envVar} não definida`);
    }
  });
}
EOF

# Atualizar o frontend para funcionar no Vercel
cat > frontend/js/script.js << 'EOF'
/**
 * PSN Analysis Pro - Frontend JavaScript
 * Sistema profissional com tema cyberpunk e funcionalidades avançadas
 * Configurado para Vercel
 */

class PSNAnalysisPro {
    constructor() {
        this.currentLanguage = 'pt-BR';
        this.backendUrl = this.getBackendUrl();
        this.isAnalyzing = false;
        this.init();
    }

    getBackendUrl() {
        // No Vercel, usamos caminhos relativos para a API
        if (window.location.hostname.includes('vercel.app') || 
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            return '/api';
        }
        return 'http://localhost:3000';
    }

    async init() {
        await this.loadTranslations();
        this.bindEvents();
        this.checkAPIStatus();
        this.setupIntersectionObserver();
    }

    bindEvents() {
        // Botão de análise
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeProfile());
        
        // Seleção de idioma
        document.getElementById('pt-BR').addEventListener('click', () => this.changeLanguage('pt-BR'));
        document.getElementById('en-US').addEventListener('click', () => this.changeLanguage('en-US'));
        
        // Enter no input
        document.getElementById('psnId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isAnalyzing) {
                this.analyzeProfile();
            }
        });

        // Efeitos de hover dinâmicos
        this.setupHoverEffects();
    }

    setupHoverEffects() {
        const cards = document.querySelectorAll('.cyber-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(-5px) scale(1)';
            });
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, { threshold: 0.1 });

        // Observar todos os cards para animação
        document.querySelectorAll('.cyber-card').forEach(card => {
            observer.observe(card);
        });
    }

    async loadTranslations() {
        try {
            const response = await fetch(`./locales/${this.currentLanguage}.json`);
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Erro ao carregar traduções:', error);
            this.translations = {};
        }
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[key]) {
                element.textContent = this.translations[key];
            }
        });
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        
        // Atualizar botões de idioma
        document.querySelectorAll('.cyber-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(lang).classList.add('active');
        
        this.loadTranslations();
    }

    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            if (response.ok) {
                document.getElementById('apiStatus').textContent = 'ONLINE';
                document.getElementById('apiStatus').className = 'status-online';
            } else {
                throw new Error('API não respondeu corretamente');
            }
        } catch (error) {
            document.getElementById('apiStatus').textContent = 'OFFLINE';
            document.getElementById('apiStatus').className = 'status-offline';
            console.warn('API offline:', error);
        }
    }

    async analyzeProfile() {
        if (this.isAnalyzing) return;

        const psnId = document.getElementById('psnId').value.trim();
        
        if (!this.validatePSNId(psnId)) {
            this.showError(this.translations.invalidPsnId || 'PSN ID inválido');
            return;
        }

        this.isAnalyzing = true;
        this.showLoading();

        try {
            const analysis = await this.fetchProfileAnalysis(psnId);
            this.displayResults(analysis);
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.isAnalyzing = false;
        }
    }

    validatePSNId(psnId) {
        if (!psnId || psnId.length < 3 || psnId.length > 16) {
            return false;
        }
        
        const psnIdRegex = /^[a-zA-Z0-9_-]+$/;
        return psnIdRegex.test(psnId);
    }

    async fetchProfileAnalysis(psnId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(`${this.backendUrl}/profile/${encodeURIComponent(psnId)}`, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tempo limite excedido. Tente novamente.');
            }
            throw error;
        }
    }

    getErrorMessage(error) {
        const message = error.message || 'Erro desconhecido';
        
        const errorMap = {
            'Perfil não encontrado': this.translations.profileNotFound || 'Perfil PSN não encontrado',
            'Tempo limite excedido': this.translations.timeoutError || 'Tempo limite excedido',
            'Network Error': this.translations.networkError || 'Erro de conexão',
            'Failed to fetch': this.translations.networkError || 'Erro de conexão'
        };

        return errorMap[message] || this.translations.genericError || 'Erro ao analisar perfil';
    }

    showLoading() {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-loading">
                <div class="loading-hologram">
                    <div class="hologram-scan"></div>
                    <div class="loading-content">
                        <div class="cyber-spinner"></div>
                        <p class="loading-text">${this.translations.analyzingProfile || 'ANALISANDO PERFIL...'}</p>
                        <div class="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    showError(message) {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-error">
                <div class="error-icon">⚡</div>
                <h3>${this.translations.errorTitle || 'ERRO'}</h3>
                <p>${message}</p>
                <button class="cyber-primary-btn retry-btn">
                    ${this.translations.tryAgain || 'TENTAR NOVAMENTE'}
                </button>
            </div>
        `;

        resultsSection.classList.remove('hidden');

        // Bind retry button
        const retryBtn = resultsSection.querySelector('.retry-btn');
        retryBtn.addEventListener('click', () => this.analyzeProfile());
    }

    displayResults(data) {
        const resultsSection = document.getElementById('results');
        
        const html = this.buildResultsHTML(data);
        resultsSection.innerHTML = html;
        resultsSection.classList.remove('hidden');

        // Animar barras de progresso
        this.animateProgressBars();
        
        // Bind eventos dos botões de recomendação
        this.bindRecommendationEvents();
    }

    buildResultsHTML(data) {
        return `
            <div class="results-container">
                <!-- Cabeçalho do Perfil -->
                <div class="profile-header cyber-card">
                    <div class="profile-avatar">
                        <img src="${data.profileInfo.avatar}" alt="Avatar" class="avatar-image" onerror="this.src='https://via.placeholder.com/80/00f3ff/111122?text=PSN'">
                        <div class="avatar-frame"></div>
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name">${data.profileInfo.name}</h2>
                        <div class="profile-stats">
                            <div class="stat-item">
                                <span class="stat-value">${data.profileInfo.level}</span>
                                <span class="stat-label">NÍVEL</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${data.profileInfo.progress}%</span>
                                <span class="stat-label">PROGRESSO</span>
                            </div>
                        </div>
                        <div class="classification-badge ${data.classification.type.toLowerCase()}">
                            <span class="badge-emoji">${data.classification.emoji}</span>
                            <span class="badge-text">${data.classification.title}</span>
                        </div>
                    </div>
                </div>

                <!-- Estatísticas de Troféus -->
                <div class="trophy-stats-grid">
                    ${this.buildTrophyStatsHTML(data.trophyStats)}
                </div>

                <!-- Sistema de Pontuação -->
                <div class="scoring-breakdown cyber-card">
                    <h3>📊 ANÁLISE DE PONTUAÇÃO</h3>
                    <div class="scoring-details">
                        ${data.scoringSystem.detalhes.map(item => `
                            <div class="scoring-item">
                                <div class="scoring-category">${item.categoria}</div>
                                <div class="scoring-bar">
                                    <div class="bar-fill" style="width: ${(item.pontos / item.max) * 100}%">
                                        <span class="bar-value">${item.pontos}/${item.max}</span>
                                    </div>
                                </div>
                                <div class="scoring-description">${item.descricao}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total-score-display">
                        <div class="total-score-value">${data.scoringSystem.pontuacaoTotal}/100</div>
                        <div class="total-score-label">PONTUAÇÃO TOTAL</div>
                    </div>
                </div>

                <!-- Análise Detalhada -->
                <div class="detailed-analysis">
                    ${this.buildGenreAnalysisHTML(data.genreAnalysis)}
                    ${this.buildTimePatternsHTML(data.timePatterns)}
                    ${this.buildGOTYGamesHTML(data.gotyGames)}
                    ${this.buildPerformanceMetricsHTML(data.performanceMetrics)}
                </div>

                <!-- Perfil do Jogador e Recomendações -->
                <div class="insights-section">
                    ${this.buildPlayerProfileHTML(data.playerProfile)}
                    ${this.buildRecommendationsHTML(data.recommendations)}
                </div>
            </div>
        `;
    }

    buildTrophyStatsHTML(stats) {
        const trophies = [
            { type: 'platinum', label: 'PLATINAS', value: stats.platinum, color: '#E5E4E2' },
            { type: 'gold', label: 'OURO', value: stats.gold, color: '#FFD700' },
            { type: 'silver', label: 'PRATA', value: stats.silver, color: '#C0C0C0' },
            { type: 'bronze', label: 'BRONZE', value: stats.bronze, color: '#CD7F32' },
            { type: 'total', label: 'TOTAL', value: stats.total, color: 'var(--cyber-primary)' }
        ];

        return trophies.map(trophy => `
            <div class="trophy-stat-card cyber-card">
                <div class="trophy-icon" style="color: ${trophy.color}">🏆</div>
                <div class="trophy-value">${trophy.value}</div>
                <div class="trophy-label">${trophy.label}</div>
            </div>
        `).join('');
    }

    buildGenreAnalysisHTML(analysis) {
        return `
            <div class="analysis-card cyber-card">
                <h3>🎮 DISTRIBUIÇÃO POR GÊNERO</h3>
                <div class="genre-bars">
                    ${analysis.genres.map(genre => `
                        <div class="genre-item">
                            <div class="genre-name">${genre.name}</div>
                            <div class="genre-bar">
                                <div class="bar-fill" style="width: ${genre.percentage}%">
                                    <span class="genre-percentage">${genre.percentage}%</span>
                                </div>
                            </div>
                            <div class="genre-count">${genre.count} jogos</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    buildTimePatternsHTML(patterns) {
        return `
            <div class="analysis-card cyber-card">
                <h3>⏱️ PADRÕES DE TEMPO</h3>
                <div class="time-patterns">
                    ${patterns.categories.map(category => `
                        <div class="time-category">
                            <div class="time-name">${category.name}</div>
                            <div class="time-bar">
                                <div class="bar-fill" style="width: ${category.percentage}%">
                                    <span class="time-percentage">${category.percentage}%</span>
                                </div>
                            </div>
                            <div class="time-count">${category.count} jogos</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    buildGOTYGamesHTML(gotyGames) {
        if (!gotyGames || !gotyGames.length) return '';
        
        return `
            <div class="analysis-card cyber-card">
                <h3>🏅 JOGOS GOTY NO PERFIL</h3>
                <div class="goty-grid">
                    ${gotyGames.map(game => `
                        <div class="goty-card">
                            <img src="${game.image}" alt="${game.name}" class="goty-image" onerror="this.src='https://via.placeholder.com/200x120/0070d2/ffffff?text=GOTY'">
                            <div class="goty-info">
                                <div class="goty-title">${game.name}</div>
                                <div class="goty-meta">${game.year} • ${game.score}/100</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    buildPerformanceMetricsHTML(metrics) {
        return `
            <div class="analysis-card cyber-card">
                <h3>📈 MÉTRICAS DE DESEMPENHO</h3>
                <div class="metrics-grid">
                    ${metrics.metrics.map(metric => `
                        <div class="metric-item">
                            <div class="metric-name">${metric.name}</div>
                            <div class="metric-value">${metric.value}</div>
                            <div class="metric-bar">
                                <div class="bar-fill" style="width: ${metric.percentage}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    buildPlayerProfileHTML(profile) {
        return `
            <div class="analysis-card cyber-card">
                <h3>👤 PERFIL DO JOGADOR</h3>
                <div class="player-profile">
                    <div class="profile-archetype">${profile.archetype}</div>
                    <p class="profile-description">${profile.description}</p>
                    <div class="profile-characteristics">
                        ${profile.characteristics.map(char => `
                            <div class="characteristic-item">✓ ${char}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    buildRecommendationsHTML(recommendations) {
        return `
            <div class="analysis-card cyber-card">
                <h3>💡 RECOMENDAÇÕES</h3>
                <div class="recommendations-list">
                    ${recommendations.map((rec, index) => `
                        <div class="recommendation-item" data-index="${index}">
                            <div class="rec-number">${index + 1}</div>
                            <div class="rec-content">
                                <h4>${rec.title}</h4>
                                <p>${rec.description}</p>
                            </div>
                            <button class="rec-action-btn">→</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    animateProgressBars() {
        const bars = document.querySelectorAll('.bar-fill');
        bars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s ease-in-out';
                bar.style.width = width;
            }, 100);
        });
    }

    bindRecommendationEvents() {
        const recItems = document.querySelectorAll('.recommendation-item');
        recItems.forEach(item => {
            const btn = item.querySelector('.rec-action-btn');
            btn.addEventListener('click', () => {
                this.showRecommendationDetail(item.dataset.index);
            });
        });
    }

    showRecommendationDetail(index) {
        // Implementar modal de detalhes da recomendação
        console.log('Mostrar detalhes da recomendação:', index);
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new PSNAnalysisPro();
});

// Adicionar estilos dinâmicos para elementos criados
const dynamicStyles = `
    .cyber-loading {
        text-align: center;
        padding: 60px 20px;
    }

    .loading-hologram {
        position: relative;
        padding: 40px;
        border: 1px solid var(--cyber-primary);
        border-radius: 10px;
        background: rgba(0, 243, 255, 0.1);
        overflow: hidden;
    }

    .hologram-scan {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.3), transparent);
        animation: hologramScan 2s linear infinite;
    }

    .cyber-spinner {
        width: 60px;
        height: 60px;
        border: 3px solid transparent;
        border-top: 3px solid var(--cyber-primary);
        border-radius: 50%;
        margin: 0 auto 20px;
        animation: spin 1s linear infinite;
    }

    .loading-dots {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-top: 10px;
    }

    .loading-dots span {
        width: 8px;
        height: 8px;
        background: var(--cyber-primary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
    }

    .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }

    .cyber-error {
        text-align: center;
        padding: 40px;
        border: 1px solid var(--cyber-danger);
        border-radius: 10px;
        background: rgba(255, 0, 60, 0.1);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 20px;
    }

    .retry-btn {
        margin-top: 20px;
    }

    .status-offline {
        color: var(--cyber-danger);
        font-weight: 600;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);
EOF

# Criar instruções de deploy para Vercel
cat > DEPLOY_VERCEL.md << 'EOF'
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