import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar environment
import '../src/config/env-loader.js';

import { PSNApiClient } from '../src/infrastructure/external/psn-api-client.js';
import { CacheRepository } from '../src/infrastructure/external/cache-repository.js';

async function debugToken() {
  try {
    console.log('🔧 Debug do Token PSN\n');
    
    if (!process.env.PSN_NPSSO_TOKEN) {
      console.log('❌ PSN_NPSSO_TOKEN não configurado');
      process.exit(1);
    }

    console.log('📋 Configuração:');
    console.log('   NPSSO Token:', process.env.PSN_NPSSO_TOKEN ? '✅ Configurado' : '❌ Faltando');
    console.log('   Redis Host:', process.env.REDIS_HOST || 'localhost');
    console.log('   Redis Port:', process.env.REDIS_PORT || 6379);
    
    const cacheRepository = new CacheRepository();
    const psnApiClient = new PSNApiClient(process.env.PSN_NPSSO_TOKEN, cacheRepository);
    
    console.log('\n🔄 Inicializando PSNApiClient...');
    await psnApiClient.initialize();
    
    console.log('\n📊 Status do Token:');
    const tokenStatus = psnApiClient.getTokenStatus();
    console.log('   Access Token:', tokenStatus.hasAccessToken ? '✅ Presente' : '❌ Faltando');
    console.log('   Refresh Token:', tokenStatus.hasRefreshToken ? '✅ Presente' : '❌ Faltando');
    console.log('   Expira em:', tokenStatus.expiresAt);
    console.log('   Segundos até expirar:', tokenStatus.secondsUntilExpiry);
    console.log('   Está expirado:', tokenStatus.isExpired ? '❌ Sim' : '✅ Não');
    
    console.log('\n🏥 Health Check:');
    const health = await psnApiClient.healthCheck();
    console.log('   Status:', health.status);
    console.log('   Mensagem:', health.message);
    
    if (health.status === 'healthy') {
      console.log('\n✅ Token está funcionando corretamente!');
    } else {
      console.log('\n❌ Problema com o token:', health.message);
    }
    
  } catch (error) {
    console.log('\n💥 Erro durante debug:');
    console.log('   Mensagem:', error.message);
    if (error.stack) {
      console.log('   Stack:', error.stack.split('\n')[1]);
    }
    process.exit(1);
  }
}

debugToken();