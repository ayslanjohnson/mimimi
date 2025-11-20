import { ProfileService } from '../services/profileService.js';
import logger from '../infrastructure/logger/logger.js';

export class ProfileController {
  constructor() {
    this.profileService = new ProfileService();
  }

  async checkUserExists(req, res) {
    try {
      const { onlineId } = req.params;
      
      if (!onlineId) {
        return res.status(400).json({
          success: false,
          error: 'onlineId é obrigatório'
        });
      }

      logger.info('Verificando existência do usuário', { onlineId });
      
      try {
        const profile = await this.profileService.getProfile(onlineId);
        
        res.json({
          success: true,
          exists: true,
          data: {
            onlineId: profile.onlineId,
            accountId: profile.accountId,
            avatarUrl: profile.avatarUrl
          }
        });
      } catch (error) {
        // Se deu erro de "não encontrado", usuário não existe
        if (error.message.includes('não encontrado') || error.message.includes('não existe')) {
          return res.json({
            success: true,
            exists: false,
            message: `Usuário "${onlineId}" não encontrado na PSN`
          });
        }
        
        // Outros erros
        throw error;
      }
      
    } catch (error) {
      logger.error('Erro ao verificar existência do usuário', { 
        onlineId: req.params.onlineId,
        error: error.message 
      });
      
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const { onlineId } = req.params;
      
      if (!onlineId) {
        return res.status(400).json({
          success: false,
          error: 'onlineId é obrigatório'
        });
      }

      logger.info('Buscando perfil do usuário', { onlineId });
      
      const profile = await this.profileService.getProfile(onlineId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Erro ao buscar perfil', { 
        onlineId: req.params.onlineId,
        error: error.message 
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getGames(req, res) {
    try {
      const { onlineId } = req.params;
      
      if (!onlineId) {
        return res.status(400).json({
          success: false,
          error: 'onlineId é obrigatório'
        });
      }

      logger.info('Buscando jogos do usuário', { onlineId });
      
      const games = await this.profileService.getGames(onlineId);
      
      res.json({
        success: true,
        data: games
      });
    } catch (error) {
      logger.error('Erro ao buscar jogos', { 
        onlineId: req.params.onlineId,
        error: error.message 
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAuthStatus(req, res) {
    try {
      const { onlineId } = req.params;
      
      logger.info('Verificando status de autenticação', { onlineId });
      
      const authStatus = await this.profileService.getAuthStatus();
      
      res.json({
        success: true,
        data: authStatus
      });
    } catch (error) {
      logger.error('Erro ao verificar status de autenticação', { 
        error: error.message 
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async refreshAuth(req, res) {
    try {
      logger.info('Forçando atualização de autenticação');
      
      await this.profileService.refreshAuth();
      
      res.json({
        success: true,
        message: 'Autenticação atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar autenticação', { 
        error: error.message 
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default ProfileController;