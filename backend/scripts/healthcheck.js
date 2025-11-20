import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar environment primeiro
import '../src/config/env-loader.js';

import axios from 'axios';

async function healthCheck() {
  const baseURL = `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;
  
  try {
    console.log('🔍 Executando health check...');
    console.log(`📡 Endpoint: ${baseURL}/health`);
    
    const response = await axios.get(`${baseURL}/health`, {
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
    });
    
    if (response.status === 200) {
      console.log('✅ Health check: APLICação saudável');
      console.log('📊 Status:', response.data);
      process.exit(0);
    } else {
      console.log('❌ Health check: Resposta não-200');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Health check: ERRO -', error.message);
    process.exit(1);
  }
}

healthCheck();