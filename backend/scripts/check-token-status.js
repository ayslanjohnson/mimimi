import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar environment primeiro
import '../src/config/env-loader.js';

import { PSNApiClient } from '../src/infrastructure/external/psn-api-client.js';
import { CacheRepository } from '../src/infrastructure/external/cache-repository.js';

async function checkTokenStatus() {
  try {
    console.log('🔐 Verificando status do token PSN...');
    
    if (!process.env.PSN_NPSSO_TOKEN) {
      console.log('❌ PSN_NPSSO_TOKEN não configurado no .env');
      process.exit(1);
    }

    const cacheRepository = new CacheRepository();
    const psnApiClient = new PSNApiClient(process.env.PSN_NPSSO_TOKEN, cacheRepository);
    
    await psnApiClient.initialize();
    const health = await psnApiClient.healthCheck();
    
    console.log('✅ Status do Token PSN:');
    console.log('   Status:', health.status);
    console.log('   Mensagem:', health.message);
    
    if (health.tokenExpiresIn) {
      console.log('   ⏰ Token expira em:', Math.floor(health.tokenExpiresIn / 60), 'minutos');
    }
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Erro ao verificar token:', error.message);
    process.exit(1);
  }
}

checkTokenStatus();