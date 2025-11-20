import { psnDataProvider } from '../infrastructure/external/index.js';
import logger from '../infrastructure/logger/logger.js';

export class ProfileService {

  async getProfile(onlineId) {
    try {
      logger.debug('ProfileService: Buscando perfil', { onlineId });
      return await psnDataProvider.getProfileData(onlineId);
    } catch (error) {
      logger.error('ProfileService: Erro ao buscar perfil', { 
        onlineId, 
        error: error.message 
      });
      throw error;
    }
  }

  async getGames(onlineId) {
    try {
      logger.debug('ProfileService: Buscando jogos', { onlineId });
      return await this.psnDataProvider.getGamesData(onlineId);
    } catch (error) {
      logger.error('ProfileService: Erro ao buscar jogos', { 
        onlineId, 
        error: error.message 
      });
      throw error;
    }
  }

  async getAuthStatus() {
    try {
      logger.debug('ProfileService: Verificando status de autenticação');
      return await this.psnDataProvider.getAuthStatus();
    } catch (error) {
      logger.error('ProfileService: Erro ao verificar status de autenticação', { 
        error: error.message 
      });
      throw error;
    }
  }

  async refreshAuth() {
    try {
      logger.debug('ProfileService: Atualizando autenticação');
      await this.psnDataProvider.refreshAuth();
    } catch (error) {
      logger.error('ProfileService: Erro ao atualizar autenticação', { 
        error: error.message 
      });
      throw error;
    }
  }
}

export default ProfileService;