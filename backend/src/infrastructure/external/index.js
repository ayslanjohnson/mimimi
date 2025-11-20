import { PSNApiClient } from './psn-api-client.js';
import { PlatPricesClient } from './plat-prices-client.js';
import { CacheRepository } from './cache-repository.js';
import { PSNDataProvider } from './psn-data-provider.js';

export let psnDataProvider;
export async function initializeDependencies() {
  try {
    // Obter NPSSO token das variáveis de ambiente
    const npssoToken = process.env.PSN_NPSSO_TOKEN;

    if (!npssoToken) {
      throw new Error('PSN_NPSSO_TOKEN é obrigatório no environment');
    }

    // Instanciar as dependências
    const cacheRepository = new CacheRepository();
    const psnApiClient = new PSNApiClient(npssoToken, cacheRepository);
    const platPricesClient = new PlatPricesClient();

    // Inicializar o cliente PSN
    await psnApiClient.initialize();

    // Criar o PSNDataProvider com injeção de dependências
    psnDataProvider = new PSNDataProvider(
      psnApiClient,
      platPricesClient,
      cacheRepository
    );

    console.log('✅ Dependências inicializadas com sucesso');
    return psnDataProvider;
  } catch (error) {
    console.error('❌ Erro ao inicializar dependências:', error.message);
    throw error;
  }
}

// Exportar uma função para acessar o psnDataProvider após inicialização
export function getPSNDataProvider() {
  if (!psnDataProvider) {
    throw new Error('Dependências não inicializadas. Chame initializeDependencies() primeiro.');
  }
  return psnDataProvider;
}

// Exportar as classes para uso em outros lugares
export default {
  PSNApiClient,
  PlatPricesClient,
  CacheRepository,
  PSNDataProvider
};