import cacheService from '../cache/cache-service.js';
import logger from '../logger/logger.js';

export class CacheRepository {
    constructor() {
        this.cache = cacheService;
        logger.info('CacheRepository inicializado');
    }

    async get(key) {
        try {
            const value = await this.cache.get(key);
            
            if (value !== null) {
                logger.debug('Cache hit', { key });
            } else {
                logger.debug('Cache miss', { key });
            }
            
            return value;
        } catch (error) {
            logger.error('Erro ao recuperar do cache', { 
                key, 
                error: error.message 
            });
            return null;
        }
    }

    async set(key, value, expirationSeconds = 3600) {
        try {
            const success = await this.cache.set(key, value, expirationSeconds);
            
            if (success) {
                logger.debug('Cache set com sucesso', { 
                    key, 
                    expirationSeconds 
                });
            } else {
                logger.warn('Falha ao setar cache', { key });
            }
            
            return success;
        } catch (error) {
            logger.error('Erro ao salvar no cache', { 
                key, 
                error: error.message 
            });
            return false;
        }
    }

    async delete(key) {
        try {
            const success = await this.cache.delete(key);
            
            if (success) {
                logger.debug('Cache deletado com sucesso', { key });
            } else {
                logger.debug('Chave não encontrada no cache para deletar', { key });
            }
            
            return success;
        } catch (error) {
            logger.error('Erro ao deletar do cache', { 
                key, 
                error: error.message 
            });
            return false;
        }
    }

    async exists(key) {
        try {
            const exists = await this.cache.exists(key);
            logger.debug('Verificação de existência no cache', { key, exists });
            return exists;
        } catch (error) {
            logger.error('Erro ao verificar existência no cache', { 
                key, 
                error: error.message 
            });
            return false;
        }
    }

    // MÉTODO CORRIGIDO - Agora usando o getOrSet do CacheService
    async getOrSet(key, fetchData, expirationSeconds = 3600) {
        try {
            return await this.cache.getOrSet(key, fetchData, expirationSeconds);
        } catch (error) {
            logger.error('Erro no padrão getOrSet', { 
                key, 
                error: error.message 
            });
            throw error;
        }
    }

    async clearByPattern(pattern) {
        try {
            // Esta funcionalidade depende do Redis SCAN
            // Em uma implementação real, você usaria redis.scan + redis.del
            logger.warn('clearByPattern não implementado para este cache', { pattern });
            return false;
        } catch (error) {
            logger.error('Erro ao limpar cache por pattern', { 
                pattern, 
                error: error.message 
            });
            return false;
        }
    }

    async clearUserData(psnId) {
        try {
            const patterns = [
                `profile_${psnId}`,
                `games_${psnId}`,
                `trophies_${psnId}`,
                `psn_access_token`
            ];

            const results = await Promise.all(
                patterns.map(pattern => this.delete(pattern))
            );

            const successCount = results.filter(Boolean).length;
            logger.info('Dados do usuário limpos do cache', { 
                psnId, 
                cleared: successCount,
                total: patterns.length 
            });

            return successCount > 0;
        } catch (error) {
            logger.error('Erro ao limpar dados do usuário do cache', { 
                psnId, 
                error: error.message 
            });
            return false;
        }
    }

    async getStats() {
        try {
            const stats = await this.cache.getStats();
            logger.debug('Estatísticas do cache obtidas');
            return stats;
        } catch (error) {
            logger.error('Erro ao obter estatísticas do cache', { error: error.message });
            return { connected: false, error: error.message };
        }
    }

    async healthCheck() {
        try {
            const health = await this.cache.healthCheck();
            return health;
        } catch (error) {
            return { 
                status: 'unhealthy', 
                message: `Cache não saudável: ${error.message}` 
            };
        }
    }
}

export default CacheRepository;