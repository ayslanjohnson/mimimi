import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar environment
import '../src/config/env-loader.js';

import { PSNApiClient } from '../src/infrastructure/external/psn-api-client.js';
import { CacheRepository } from '../src/infrastructure/external/cache-repository.js';

async function diagnosePSN() {
  console.log('🔧 Diagnóstico Completo do PSN API\n');
  
  // Verificar environment
  console.log('📋 Verificando Environment:');
  console.log('   PSN_NPSSO_TOKEN:', process.env.PSN_NPSSO_TOKEN ? `✅ (${process.env.PSN_NPSSO_TOKEN.length} chars)` : '❌ Não configurado');
  console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'localhost');
  console.log('   REDIS_PORT:', process.env.REDIS_PORT || 6379);
  
  if (!process.env.PSN_NPSSO_TOKEN) {
    console.log('\n❌ PSN_NPSSO_TOKEN não configurado no .env');
    process.exit(1);
  }

  if (process.env.PSN_NPSSO_TOKEN.length !== 64) {
    console.log(`\n❌ NPSSO token deve ter 64 caracteres. Atual: ${process.env.PSN_NPSSO_TOKEN.length}`);
    process.exit(1);
  }

  try {
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
      console.log('\n🎉 PSN API está funcionando!');
      
      // Testar busca de perfil
      console.log('\n👤 Testando busca de perfil...');
      try {
        const profile = await psnApiClient.getUserProfile('JegueParalitico');
        console.log('✅ Perfil encontrado:');
        console.log('   Online ID:', profile.onlineId);
        console.log('   Account ID:', profile.accountId);
        console.log('   Avatar:', profile.avatarUrl ? '✅' : '❌');
        
        console.log('\n🎮 Testando busca de jogos...');
        const games = await psnApiClient.getUserTitles('JegueParalitico');
        console.log(`✅ ${games.length} jogos encontrados`);
        
      } catch (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
      }
    } else {
      console.log('\n❌ PSN API não está funcionando:', health.message);
    }
    
  } catch (error) {
    console.log('\n💥 Erro durante diagnóstico:');
    console.log('   Mensagem:', error.message);
    console.log('   Stack:', error.stack);
    process.exit(1);
  }
}

diagnosePSN();