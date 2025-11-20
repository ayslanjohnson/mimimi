import express from 'express';
import profileRoutes from './profile.js';
import healthRoutes from './health.js';

const router = express.Router();

// Rotas de health check
router.use('/health', healthRoutes);

// Rotas de perfil
router.use('/profile', profileRoutes);

// Rota padrão
router.get('/', (req, res) => {
  res.json({
    message: 'PSN API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback para 404
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

export default router;