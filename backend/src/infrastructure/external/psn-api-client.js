import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  exchangeRefreshTokenForAuthTokens,
  getUserTitles,
  getProfileFromUserName,
  makeUniversalSearch,
  getProfileFromAccountId
} from 'psn-api';
import logger from '../logger/logger.js';

export class PSNApiClient {
  constructor(npssoToken, cacheRepository) {
    if (!npssoToken) {
      throw new Error('NPSSO token é obrigatório. Configure PSN_NPSSO_TOKEN no .env');
    }
    
    if (npssoToken.length !== 64) {
      throw new Error(`NPSSO token deve ter 64 caracteres. Atual: ${npssoToken.length}`);
    }
    
    this.npsso = npssoToken;
    this.cache = cacheRepository;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    logger.info('PSNApiClient inicializado');
  }

  async initialize() {
    try {
      logger.debug('Inicializando PSNApiClient...');
      await this.authenticateWithNpsso();
      logger.info('PSNApiClient autenticado e pronto');
    } catch (error) {
      logger.error('Falha crítica na inicialização do PSNApiClient', { 
        error: error.message
      });
      throw error;
    }
  }

  async authenticateWithNpsso() {
    try {
      logger.debug('Iniciando autenticação com NPSSO');
      
      const accessCode = await exchangeNpssoForAccessCode(this.npsso);
      logger.debug('Access code obtido');
      
      const authTokens = await exchangeAccessCodeForAuthTokens(accessCode);
      
      if (!authTokens.accessToken) {
        throw new Error('Access token não recebido na resposta');
      }
      
      this.accessToken = authTokens.accessToken;
      this.refreshToken = authTokens.refreshToken;
      this.tokenExpiresAt = Date.now() + (authTokens.expiresIn * 1000);
      
      logger.info('Autenticação PSN realizada com sucesso', {
        expiresIn: authTokens.expiresIn
      });
      
    } catch (error) {
      logger.error('Falha na autenticação com NPSSO', { 
        error: error.message
      });
      
      if (error.message.includes('invalid_grant')) {
        throw new Error('NPSSO token expirado ou inválido. Obtenha um novo em: https://ca.account.sony.com/api/v1/ssocookie');
      }
      
      throw new Error(`Falha na autenticação PSN: ${error.message}`);
    }
  }

  isTokenExpired() {
    if (!this.tokenExpiresAt) return true;
    return Date.now() >= (this.tokenExpiresAt - 120000); // 2 minutos antes
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      logger.debug('Token inválido ou expirado, renovando...');
      await this.authenticateWithNpsso();
    }
  }

  async getUserProfile(onlineId) {
    await this.ensureValidToken();
    
    // Estratégia 1: Tentar makeUniversalSearch primeiro
    let profile = await this.tryMakeUniversalSearch(onlineId);
    if (profile) {
      logger.debug('Perfil encontrado via makeUniversalSearch', { onlineId });
      return profile;
    }
    
    // Estratégia 2: Tentar getProfileFromUserName
    profile = await this.tryGetProfileFromUserName(onlineId);
    if (profile) {
      logger.debug('Perfil encontrado via getProfileFromUserName', { onlineId });
      return profile;
    }
    
    // Estratégia 3: Tentar buscar por variações do nome
    profile = await this.tryUsernameVariations(onlineId);
    if (profile) {
      logger.debug('Perfil encontrado via variações de username', { onlineId });
      return profile;
    }
    
    throw new Error(`Perfil "${onlineId}" não encontrado na PSN. O usuário pode não existir ou ter configurações de privacidade que impedem a busca.`);
  }

  async tryMakeUniversalSearch(onlineId) {
    try {
      logger.debug('Tentando makeUniversalSearch...', { onlineId });
      const searchResult = await makeUniversalSearch(this.accessToken, onlineId, "SocialAllAccounts");
      
      if (searchResult?.domainResponses) {
        const socialAccounts = searchResult.domainResponses.find(d => d.domain === "SocialAllAccounts");
        if (socialAccounts?.results?.length > 0) {
          const result = socialAccounts.results[0];
          return this.transformProfileFromSearch(result);
        }
      }
      return null;
    } catch (error) {
      logger.debug('makeUniversalSearch falhou', { onlineId, error: error.message });
      return null;
    }
  }

  async tryGetProfileFromUserName(onlineId) {
    try {
      logger.debug('Tentando getProfileFromUserName...', { onlineId });
      const profile = await getProfileFromUserName(this.accessToken, onlineId);
      return this.transformProfileFromUserName(profile);
    } catch (error) {
      logger.debug('getProfileFromUserName falhou', { onlineId, error: error.message });
      return null;
    }
  }

  async tryUsernameVariations(onlineId) {
    // Tentar variações comuns do username
    const variations = [
      onlineId,
      onlineId.replace(/_/g, '-'), // substituir _ por -
      onlineId.replace(/-/g, '_'), // substituir - por _
      onlineId.toLowerCase(),
      onlineId.toUpperCase()
    ];
    
    // Remover duplicatas
    const uniqueVariations = [...new Set(variations)];
    
    for (const variation of uniqueVariations) {
      if (variation === onlineId) continue; // Já tentamos o original
      
      logger.debug('Tentando variação de username...', { variation });
      const profile = await this.tryMakeUniversalSearch(variation);
      if (profile) return profile;
    }
    
    return null;
  }

  transformProfileFromSearch(searchResult) {
    if (!searchResult.socialMetadata) return null;
    
    return {
      accountId: searchResult.socialMetadata.accountId,
      onlineId: searchResult.socialMetadata.onlineId,
      avatarUrl: searchResult.socialMetadata.avatarUrl,
      isPlus: searchResult.socialMetadata.isPlus,
      isOfficiallyVerified: searchResult.socialMetadata.isOfficiallyVerified,
      personalDetail: {
        firstName: searchResult.socialMetadata.firstName,
        lastName: searchResult.socialMetadata.lastName
      },
      primaryOnlineStatus: searchResult.socialMetadata.primaryOnlineStatus,
      source: 'makeUniversalSearch'
    };
  }

  transformProfileFromUserName(profileData) {
    return {
      accountId: profileData.accountId,
      onlineId: profileData.onlineId,
      avatarUrl: profileData.avatarUrls?.[0]?.avatarUrl,
      isPlus: profileData.isPlus,
      isOfficiallyVerified: profileData.isOfficiallyVerified,
      personalDetail: {
        firstName: profileData.firstName,
        lastName: profileData.lastName
      },
      primaryOnlineStatus: profileData.primaryOnlineStatus,
      trophySummary: profileData.trophySummary,
      source: 'getProfileFromUserName'
    };
  }

  async getUserTitles(onlineId) {
    try {
      await this.ensureValidToken();
      logger.debug('Buscando títulos do usuário PSN', { onlineId });
      
      const profile = await this.getUserProfile(onlineId);
      const accountId = profile.accountId;
      
      if (!accountId) {
        throw new Error('Não foi possível obter accountId do usuário');
      }
      
      const titlesResponse = await getUserTitles({
        accessToken: this.accessToken
      }, accountId);
      
      return this.transformTitlesResponse(titlesResponse);
      
    } catch (error) {
      logger.error('Falha ao buscar títulos do usuário PSN', { 
        onlineId, 
        error: error.message 
      });
      throw error;
    }
  }

  transformTitlesResponse(titlesData) {
    if (!titlesData?.trophyTitles) return [];
    
    return titlesData.trophyTitles.map(title => ({
      id: title.npCommunicationId,
      titleId: title.npServiceName,
      name: title.trophyTitleName,
      imageUrl: title.trophyTitleIconUrl,
      platform: title.trophyTitlePlatform,
      earnedTrophies: {
        bronze: title.earnedTrophies?.bronze || 0,
        silver: title.earnedTrophies?.silver || 0,
        gold: title.earnedTrophies?.gold || 0,
        platinum: title.earnedTrophies?.platinum || 0
      },
      definedTrophies: {
        bronze: title.definedTrophies?.bronze || 0,
        silver: title.definedTrophies?.silver || 0,
        gold: title.definedTrophies?.gold || 0,
        platinum: title.definedTrophies?.platinum || 0
      },
      progress: title.progress || 0,
      lastUpdated: title.lastUpdatedDateTime
    }));
  }

  async healthCheck() {
    try {
      await this.ensureValidToken();
      
      // Testar com um usuário conhecido que existe
      await this.tryMakeUniversalSearch('PlayStation');
      
      return { 
        status: 'healthy', 
        message: 'PSN API conectada e autenticada',
        tokenExpiresIn: this.tokenExpiresAt ? Math.round((this.tokenExpiresAt - Date.now()) / 1000) : 0
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `PSN API não disponível: ${error.message}` 
      };
    }
  }

  getTokenStatus() {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      isExpired: this.isTokenExpired(),
      expiresAt: this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : null,
      secondsUntilExpiry: this.tokenExpiresAt ? Math.round((this.tokenExpiresAt - Date.now()) / 1000) : null
    };
  }
}

export default PSNApiClient;