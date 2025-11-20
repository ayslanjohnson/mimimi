import logger from '../logger/logger.js';

export class PSNDataProvider {
  constructor(psnApiClient, platPricesClient, cacheRepository) {
    if (!psnApiClient) throw new Error('psnApiClient é obrigatório');
    if (!platPricesClient) throw new Error('platPricesClient é obrigatório');
    if (!cacheRepository) throw new Error('cacheRepository é obrigatório');
    
    this.psnApi = psnApiClient;
    this.platPrices = platPricesClient;
    this.cache = cacheRepository;
    
    logger.info('PSNDataProvider inicializado com injeção de dependências');
  }

  async getProfileData(onlineId) {
    const cacheKey = `profile_${onlineId}`;
    
    try {
      return await this.cache.getOrSet(
        cacheKey,
        async () => {
          logger.debug('Buscando perfil da PSN API', { onlineId });
          const profile = await this.psnApi.getUserProfile(onlineId);
          
          if (!profile) {
            throw new Error(`Perfil "${onlineId}" não encontrado`);
          }
          
          logger.info('Perfil encontrado na PSN API', { 
            onlineId,
            source: profile.source 
          });
          
          return profile;
        },
        3600 // 1 hora de cache
      );
    } catch (error) {
      logger.warn('Falha ao buscar perfil da PSN API, tentando PlatPrices', { 
        onlineId, 
        error: error.message 
      });
      
      // Só tentar PlatPrices se for erro de "não encontrado"
      if (error.message.includes('não encontrado') || error.message.includes('não existe')) {
        return await this.getProfileFromPlatPrices(onlineId);
      }
      
      throw error;
    }
  }

  async getGamesData(onlineId) {
    const cacheKey = `games_${onlineId}`;
    
    try {
      return await this.cache.getOrSet(
        cacheKey,
        async () => {
          logger.debug('Buscando jogos da PSN API', { onlineId });
          
          const titles = await this.psnApi.getUserTitles(onlineId);
          
          // Só enriquecer se tivermos jogos
          if (titles.length > 0) {
            const enrichedGames = await Promise.all(
              titles.map(async game => this.enrichGameData(game))
            );
            
            logger.info('Jogos recuperados e enriquecidos com sucesso', { 
              onlineId, 
              gameCount: enrichedGames.length 
            });
            
            return enrichedGames;
          }
          
          logger.info('Nenhum jogo encontrado para o usuário', { onlineId });
          return [];
        },
        1800 // 30 minutos de cache
      );
    } catch (error) {
      logger.error('Falha ao buscar dados dos jogos', { 
        onlineId, 
        error: error.message 
      });
      
      // Se não conseguir buscar jogos, retornar array vazio
      if (error.message.includes('não encontrado') || error.message.includes('não existe')) {
        return [];
      }
      
      throw new Error(`Failed to fetch games data: ${error.message}`);
    }
  }

  async enrichGameData(game) {
    try {
      const gameInfo = await this.platPrices.getGameData(game.name);
      return {
        ...game,
        metacriticScore: gameInfo?.metacriticScore || null,
        genre: gameInfo?.genre || 'Unknown',
        difficulty: gameInfo?.difficulty || 'Unknown',
        estimatedTime: gameInfo?.hoursHigh || null,
        gotyWinner: this.checkGOTYStatus(gameInfo)
      };
    } catch (error) {
      logger.warn('Falha ao enriquecer dados do jogo, retornando dados básicos', {
        game: game.name,
        error: error.message
      });
      return game;
    }
  }

  async getProfileFromPlatPrices(onlineId) {
    try {
      logger.debug('Buscando perfil do PlatPrices como fallback', { onlineId });
      const profile = await this.platPrices.getUserProfile(onlineId);
      
      if (!profile) {
        throw new Error(`Perfil "${onlineId}" não encontrado no PlatPrices`);
      }
      
      return profile;
    } catch (error) {
      logger.error('Fallback do PlatPrices também falhou', { 
        onlineId, 
        error: error.message 
      });
      throw new Error(`Perfil "${onlineId}" não encontrado na PSN nem no PlatPrices`);
    }
  }

  checkGOTYStatus(gameInfo) {
    if (!gameInfo) return false;
    
    const gotyIndicators = [
      gameInfo.awards?.includes('GOTY'),
      gameInfo.title?.toLowerCase().includes('game of the year'),
      gameInfo.metacriticScore >= 90
    ];
    
    return gotyIndicators.some(indicator => indicator === true);
  }

  async getAuthStatus() {
    return await this.psnApi.healthCheck();
  }

  async refreshAuth() {
    await this.psnApi.authenticateWithNpsso();
  }
}

export default PSNDataProvider;