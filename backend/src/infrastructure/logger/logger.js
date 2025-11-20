import pino from 'pino';

const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss.l',
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
};

// Exportar instância direta do Pino
const logger = pino(loggerConfig);

// Adicionar métodos auxiliares diretamente ao logger
logger.http = (message, meta = {}) => {
  logger.info({ ...meta, type: 'HTTP' }, message);
};

logger.database = (message, meta = {}) => {
  logger.info({ ...meta, type: 'DATABASE' }, message);
};

logger.cache = (message, meta = {}) => {
  logger.debug({ ...meta, type: 'CACHE' }, message);
};

logger.performance = (message, duration, meta = {}) => {
  logger.info({ ...meta, type: 'PERFORMANCE', duration }, message);
};

export default logger;