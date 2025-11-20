import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeDependencies } from '../infrastructure/external/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar arquivo .env baseado no NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

const result = config({
  path: resolve(process.cwd(), envFile)
});

if (result.error) {
  console.warn(`⚠️  Arquivo ${envFile} não encontrado, usando variáveis de ambiente do sistema`);
} else {
  console.log(`✅ Environment carregado de: ${envFile}`);
}

// Validações de variáveis obrigatórias
function validateEnvironment() {
  const required = ['PSN_NPSSO_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    console.error('❌ Variáveis de ambiente obrigatórias faltando:', missing.join(', '));
    console.error('💡 Configure essas variáveis no arquivo .env');
    process.exit(1);
  }
}

validateEnvironment();

// Inicializar dependências após carregar environment
if (process.env.NODE_ENV !== 'test') {
  initializeDependencies().catch(error => {
    console.error('❌ Falha crítica ao inicializar dependências:', error.message);
    process.exit(1);
  });
}

export default process.env;