import { createClient } from 'redis';
import logger from '../logger/logger.js';

export class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connect();
    }

    async connect() {
        try {
            this.client = createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger.warn('Máximo de tentativas de reconexão ao Redis atingido');
                            return new Error('Máximo de tentativas atingido');
                        }
                        return Math.min(retries * 100, 1000);
                    }
                },
                password: process.env.REDIS_PASSWORD || undefined,
            });

            this.client.on('error', (error) => {
                logger.error('Erro no Redis:', error);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Conectado ao Redis');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                logger.warn('Desconectado do Redis');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            logger.error('Falha ao conectar com Redis:', error);
            this.isConnected = false;
        }
    }

    async set(key, value, expirationSeconds = 3600) {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Operação set ignorada.');
            return false;
        }

        try {
            const serializedValue = typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value);
            
            if (expirationSeconds > 0) {
                await this.client.setEx(key, expirationSeconds, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }
            
            logger.debug(`Cache set para key: ${key}`);
            return true;
        } catch (error) {
            logger.error(`Erro ao salvar no cache (key: ${key}):`, error);
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Operação get ignorada.');
            return null;
        }

        try {
            const value = await this.client.get(key);
            
            if (!value) {
                return null;
            }

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logger.error(`Erro ao recuperar do cache (key: ${key}):`, error);
            return null;
        }
    }

    async delete(key) {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Operação delete ignorada.');
            return false;
        }

        try {
            const result = await this.client.del(key);
            logger.debug(`Cache delete para key: ${key}`);
            return result > 0;
        } catch (error) {
            logger.error(`Erro ao deletar do cache (key: ${key}):`, error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Operação exists ignorada.');
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Erro ao verificar existência no cache (key: ${key}):`, error);
            return false;
        }
    }

    async flush() {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Operação flush ignorada.');
            return false;
        }

        try {
            await this.client.flushAll();
            logger.debug('Cache flush realizado');
            return true;
        } catch (error) {
            logger.error('Erro ao limpar cache:', error);
            return false;
        }
    }

    async getStats() {
        if (!this.isConnected) {
            return { connected: false };
        }

        try {
            const info = await this.client.info();
            return {
                connected: true,
                info: info
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'Redis não conectado' };
            }
            
            await this.client.ping();
            return { status: 'healthy', message: 'Redis conectado e respondendo' };
        } catch (error) {
            return { status: 'unhealthy', message: `Redis não responde: ${error.message}` };
        }
    }

    // NOVO MÉTODO IMPLEMENTADO
    async getOrSet(key, fetchData, expirationSeconds = 3600) {
        if (!this.isConnected) {
            logger.warn('Cache não disponível. Buscando dados diretamente.', { key });
            return await fetchData();
        }

        try {
            // Tenta pegar do cache primeiro
            const cached = await this.get(key);
            if (cached !== null) {
                logger.debug('Cache hit no getOrSet', { key });
                return cached;
            }

            logger.debug('Cache miss no getOrSet, buscando dados', { key });
            
            // Se não tem no cache, busca os dados
            const data = await fetchData();
            
            // Salva no cache para próximas requisições
            await this.set(key, data, expirationSeconds);
            
            return data;
        } catch (error) {
            logger.error(`Erro no padrão getOrSet (key: ${key}):`, error);
            // Em caso de erro, tenta buscar os dados diretamente
            return await fetchData();
        }
    }
}

export default new CacheService();