import axios from 'axios';
import logger from '../logger/logger.js';

export class PlatPricesClient {
  constructor() {
    this.baseURL = process.env.PLAT_PRICES_API_BASE || 'https://api.platprices.com';
    this.apiKey = process.env.PLAT_PRICES_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'User-Agent': 'PSN-Backend/1.0.0',
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Fazendo request para PlatPrices API', { 
          url: config.url,
          method: config.method 
        });
        return config;
      },
      (error) => {
        logger.error('Erro no request para PlatPrices API', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Resposta recebida da PlatPrices API', { 
          url: response.config.url,
          status: response.status 
        });
        return response;
      },
      (error) => {
        logger.error('Erro na resposta da PlatPrices API', { 
          url: error.config?.url,
          status: error.response?.status,
          error: error.message 
        });
        
        if (error.response?.status === 404) {
          throw new Error('Jogo não encontrado no PlatPrices');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit excedido no PlatPrices');
        }
        
        return Promise.reject(error);
      }
    );
  }

  async getGameData(gameName) {
    try {
      logger.debug('Buscando dados do jogo no PlatPrices', { gameName });
      
      // PlatPrices pode usar diferentes endpoints
      const response = await this.client.get('/games/search', {
        params: {
          name: gameName,
          platform: 'ps4,ps5'
        }
      });

      // Assumindo que retorna array e pegamos o primeiro resultado relevante
      const games = response.data?.games || response.data || [];
      const bestMatch = this.findBestMatch(gameName, games);
      
      if (!bestMatch) {
        throw new Error(`Jogo "${gameName}" não encontrado no PlatPrices`);
      }

      return this.transformGameResponse(bestMatch);
    } catch (error) {
      logger.warn('Falha ao buscar dados do jogo no PlatPrices', { 
        gameName, 
        error: error.message 
      });
      throw error; // Re-throw para tratamento no caller
    }
  }

  async getUserProfile(psnId) {
    try {
      logger.debug('Buscando perfil do usuário no PlatPrices', { psnId });
      
      const response = await this.client.get(`/users/${psnId}`);
      
      return this.transformUserProfileResponse(response.data);
    } catch (error) {
      logger.error('Falha ao buscar perfil do usuário no PlatPrices', { 
        psnId, 
        error: error.message 
      });
      throw new Error(`Falha ao buscar perfil PlatPrices: ${error.message}`);
    }
  }

  findBestMatch(gameName, games) {
    if (!games.length) return null;
    
    const normalizedSearch = gameName.toLowerCase().trim();
    
    // Tentar encontrar match exato primeiro
    const exactMatch = games.find(game => 
      game.name?.toLowerCase() === normalizedSearch
    );
    
    if (exactMatch) return exactMatch;
    
    // Buscar por match parcial
    const partialMatch = games.find(game => 
      game.name?.toLowerCase().includes(normalizedSearch) ||
      normalizedSearch.includes(game.name?.toLowerCase())
    );
    
    return partialMatch || games[0]; // Retorna o primeiro como fallback
  }

  transformGameResponse(gameData) {
    return {
      id: gameData.id,
      name: gameData.name,
      metacriticScore: gameData.metacritic_score,
      genre: gameData.genre,
      difficulty: gameData.difficulty,
      hoursHigh: gameData.hours_high,
      hoursLow: gameData.hours_low,
      hoursMain: gameData.hours_main,
      hoursMainExtra: gameData.hours_main_extra,
      hoursComplete: gameData.hours_complete,
      platforms: gameData.platforms,
      releaseDate: gameData.release_date,
      developer: gameData.developer,
      publisher: gameData.publisher,
      awards: gameData.awards,
      price: gameData.price,
      psnPrice: gameData.psn_price
    };
  }

  transformUserProfileResponse(profileData) {
    return {
      psnId: profileData.psn_id,
      username: profileData.username,
      level: profileData.level,
      progress: profileData.progress,
      trophies: {
        bronze: profileData.trophies_bronze,
        silver: profileData.trophies_silver,
        gold: profileData.trophies_gold,
        platinum: profileData.trophies_platinum,
        total: profileData.trophies_total
      },
      country: profileData.country,
      avatarUrl: profileData.avatar,
      lastUpdated: profileData.last_updated
    };
  }

  // Health check da API
  async healthCheck() {
    try {
      await this.client.get('/health');
      return { status: 'healthy', message: 'PlatPrices API conectada' };
    } catch (error) {
      return { status: 'unhealthy', message: `PlatPrices API não disponível: ${error.message}` };
    }
  }
}

export default PlatPricesClient;