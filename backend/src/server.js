// Carregar environment primeiro
import './config/env-loader.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './infrastructure/logger/logger.js';
import routes from './routes/index.js';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(compression());

// CORS configurado para Vercel
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://mimimi-gamer.vercel.app/', // Substitua pelo seu domínio do frontend
    process.env.CORS_ORIGIN // Variável de ambiente no Vercel
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por windowMs
});
app.use(limiter);

// Logging
app.use(pinoHttp({ 
  logger,
  autoLogging: true 
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', routes);

// Health check para Vercel
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handler global
app.use((error, req, res, next) => {
  logger.error('Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : error.message
  });
});

// Export para Vercel serverless
export default app;

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  });
}