import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exchangeNpssoForAccessCode, exchangeAccessCodeForAuthTokens } from 'psn-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar environment
import '../src/config/env-loader.js';

async function verifyNpsso() {
  const npsso = process.env.PSN_NPSSO_TOKEN;
  
  if (!npsso) {
    console.log('❌ PSN_NPSSO_TOKEN não encontrado no .env');
    process.exit(1);
  }

  console.log('🔍 Verificando NPSSO token...');
  console.log('📝 Token:', npsso);
  console.log('📏 Comprimento:', npsso.length, 'caracteres');

  try {
    console.log('\n🔄 Tentando obter access code...');
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    console.log('✅ Access code obtido com sucesso!');
    console.log('🔑 Access Code:', accessCode);

    console.log('\n🔄 Tentando obter access token...');
    const authTokens = await exchangeAccessCodeForAuthTokens(accessCode);
    console.log('✅ Access token obtido com sucesso!');
    console.log('📊 Detalhes do token:');
    console.log('   - Access Token:', authTokens.accessToken ? '✅ Presente' : '❌ Ausente');
    console.log('   - Refresh Token:', authTokens.refreshToken ? '✅ Presente' : '❌ Ausente');
    console.log('   - Expira em:', authTokens.expiresIn, 'segundos');
    console.log('   - Escopo:', authTokens.scope);

    console.log('\n🎉 NPSSO token é válido!');
    return true;
  } catch (error) {
    console.log('\n❌ Erro ao verificar NPSSO token:');
    console.log('   Mensagem:', error.message);
    console.log('   Código:', error.code);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 O NPSSO token está expirado ou é inválido.');
      console.log('   Obtenha um novo token em: https://ca.account.sony.com/api/v1/ssocookie');
    }
    
    return false;
  }
}

verifyNpsso().then(success => {
  process.exit(success ? 0 : 1);
});