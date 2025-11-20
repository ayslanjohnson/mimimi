import { psnDataProvider } from '../infrastructure/external/index.js';
import cacheService from '../infrastructure/cache/cache-service.js';
import logger from '../infrastructure/logger/logger.js';

export class HealthController {
  psnDataProvider = psnDataProvider;
  async getHealth(req, res) {
    try {
      const [psnHealth, cacheHealth] = await Promise.all([
        psnDataProvider.getAuthStatus(),
        cacheService.healthCheck()
      ]);

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          psnApi: psnHealth,
          cache: cacheHealth,
          server: { status: 'healthy' }
        }
      };

      // Se algum serviço estiver unhealthy, muda o status geral
      if (psnHealth.status !== 'healthy' || cacheHealth.status !== 'healthy') {
        healthStatus.status = 'degraded';
      }

      res.json(healthStatus);
    } catch (error) {
      logger.error('Erro no health check', { error: error.message });
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

export default HealthController;