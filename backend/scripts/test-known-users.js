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

async function testKnownUsers() {
  console.log('🧪 Testando usuários conhecidos da PSN\n');
  
  const npsso = process.env.PSN_NPSSO_TOKEN;
  const knownUsers = [
    'PlayStation',
    'Sony',
    'Naughty_Dog',
    'InsomniacGames',
    'SantaMonicaStudio'
  ];
  
  if (!npsso) {
    console.log('❌ PSN_NPSSO_TOKEN não configurado');
    return;
  }
  
  try {
    console.log('1. Obtendo access code...');
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    console.log('✅ Access code obtido');
    
    console.log('2. Obtendo access token...');
    const { accessToken } = await exchangeAccessCodeForAuthTokens(accessCode);
    console.log('✅ Access token obtido\n');
    
    for (const username of knownUsers) {
      console.log(`🔍 Testando usuário: ${username}`);
      
      // Testar makeUniversalSearch
      try {
        const searchResult = await makeUniversalSearch(accessToken, username, 'SocialAllAccounts');
        const socialAccounts = searchResult.domainResponses?.find(d => d.domain === 'SocialAllAccounts');
        const results = socialAccounts?.results || [];
        
        console.log(`   makeUniversalSearch: ${results.length} resultados`);
        
        if (results.length > 0) {
          console.log(`   ✅ Encontrado: ${results[0].socialMetadata?.onlineId}`);
        }
      } catch (error) {
        console.log(`   ❌ makeUniversalSearch falhou: ${error.message}`);
      }
      
      // Testar getProfileFromUserName
      try {
        const profile = await getProfileFromUserName(accessToken, username);
        console.log(`   ✅ getProfileFromUserName: ${profile.onlineId} (${profile.accountId})`);
      } catch (error) {
        console.log(`   ❌ getProfileFromUserName falhou: ${error.message}`);
      }
      
      console.log(''); // Linha em branco entre usuários
    }
    
  } catch (error) {
    console.log('💥 Erro no teste:', error.message);
  }
}

testKnownUsers();