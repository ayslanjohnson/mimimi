import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  makeUniversalSearch,
  getProfileFromUserName
} from 'psn-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import '../src/config/env-loader.js';

async function testDirectly() {
  console.log('🧪 Teste direto da PSN API\n');
  
  const npsso = process.env.PSN_NPSSO_TOKEN;
  
  if (!npsso) {
    console.log('❌ PSN_NPSSO_TOKEN não configurado');
    return;
  }
  
  try {
    console.log('1. Obtendo access code...');
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    console.log('✅ Access code:', accessCode);
    
    console.log('2. Obtendo access token...');
    const { accessToken } = await exchangeAccessCodeForAuthTokens(accessCode);
    console.log('✅ Access token obtido');
    
    console.log('3. Testando makeUniversalSearch com "PlayStation"...');
    const search1 = await makeUniversalSearch(accessToken, 'PlayStation', 'SocialAllAccounts');
    console.log('✅ makeUniversalSearch funcionou');
    console.log('   Resultados:', search1.domainResponses?.[0]?.results?.length || 0);
    
    console.log('4. Testando makeUniversalSearch com "KingOfTrophies97"...');
    const search2 = await makeUniversalSearch(accessToken, 'KingOfTrophies97', 'SocialAllAccounts');
    console.log('✅ makeUniversalSearch funcionou');
    console.log('   Resultados:', search2.domainResponses?.[0]?.results?.length || 0);
    
    if (search2.domainResponses?.[0]?.results?.length > 0) {
      console.log('   Primeiro resultado:', search2.domainResponses[0].results[0].socialMetadata.onlineId);
    }
    
    console.log('5. Testando getProfileFromUserName com "KingOfTrophies97"...');
    try {
      const profile = await getProfileFromUserName(accessToken, 'KingOfTrophies97');
      console.log('✅ getProfileFromUserName funcionou');
      console.log('   Online ID:', profile.onlineId);
      console.log('   Account ID:', profile.accountId);
    } catch (error) {
      console.log('❌ getProfileFromUserName falhou:', error.message);
    }
    
  } catch (error) {
    console.log('💥 Erro no teste direto:', error.message);
  }
}

testDirectly();