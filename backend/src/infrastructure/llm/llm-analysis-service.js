import OpenAI from 'openai';

/**
 * Serviço de análise com LLM (OpenAI GPT-4)
 * Implementa análise inteligente de perfis PSN
 */
export class LLMAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000 // 30 segundos timeout
    });
  }

  /**
   * Analisa perfil PSN usando LLM
   */
  async analyzeProfile(profileData, gamesData) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY não configurada, usando análise padrão');
      return this.getDefaultAnalysis(profileData, gamesData);
    }

    try {
      const prompt = this.buildAnalysisPrompt(profileData, gamesData);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Validar estrutura da resposta
      return this.validateLLMResponse(analysis, profileData, gamesData);

    } catch (error) {
      console.error('❌ Erro na análise LLM:', error);
      throw new Error(`Falha na análise inteligente: ${error.message}`);
    }
  }

  /**
   * Constrói prompt detalhado para análise
   */
  buildAnalysisPrompt(profileData, gamesData) {
    const gamesSummary = this.getGamesSummary(gamesData);
    const profileSummary = this.getProfileSummary(profileData);

    return `
# ANÁLISE DE PERFIL PSN - SISTEMA "MI MI MI"

## CONTEXTO:
Você é um analista especialista em perfis de jogadores PlayStation com profundo conhecimento em trophy hunting, game design e psicologia do jogador.

## DADOS DO PERFIL:
${profileSummary}

## BIBLIOTECA DE JOGOS:
${gamesSummary}

## SISTEMA DE PONTUAÇÃO (0-100 pontos):
1. **PLATINAS** (30 pontos): Taxa de platinas = (platinas conquistadas ÷ total de jogos) × 100
2. **COMPLETUDE** (20 pontos): % de completude média do perfil × 0.2
3. **PLATINAS RARAS** (20 pontos): Platinas com raridade < 20% no PSN (cada = 2 pontos)
4. **JOGOS GOTY** (15 pontos): Jogos que ganharam Game of The Year (cada = 3 pontos)
5. **ALTA DIFICULDADE** (15 pontos): Jogos com dificuldade 7/10+ (cada = 2 pontos)

## CLASSIFICAÇÃO "MI MI MI":
- **0-40 pontos**: 🐱 MIADO - Foco em platinas fáceis, jogos simples, poucos troféus raros
- **41-75 pontos**: 😺 MIGUÉ - Equilíbrio entre dificuldade e variedade, algumas platinas raras
- **76-90 pontos**: 😻 MISERÊ - Muitas platinas raras, jogos GOTY, alta dificuldade (7/10+)
- **91-100 pontos**: 🏆 MISERAVÃO - Lenda do trophy hunting, perfil excepcional em todos os aspectos

## FORMATO DE RESPOSTA EXIGIDO (JSON):
{
  "playerProfile": {
    "archetype": "string (ex: Completista Equilibrado, Trophy Hunter Ávido, Explorador Casual)",
    "description": "string (descrição detalhada do estilo de jogo)",
    "characteristics": ["string array (3-5 características principais)"]
  },
  "recommendations": [
    {
      "title": "string",
      "description": "string (recomendação específica e acionável)"
    }
  ]
}

## INSTRUÇÕES DE ANÁLISE:
1. Seja analítico mas divertido, use linguagem gamer
2. Destaque pontos fortes e áreas de melhoria específicas
3. Considere variedade de gêneros, qualidade dos jogos, padrões de completude
4. Use referências da cultura gamer quando apropriado
5. Justifique insights com dados disponíveis
6. Mantenha recomendações práticas e realistas

## EXEMPLOS DE ARCHETYPES:
- "Completista de Elite" - Foco em 100% em todos os jogos
- "Caçador de Troféus" - Busca ativa por platinas
- "Explorador Narrativo" - Foco em histórias e experiências
- "Variedade Equilibrada" - Mix de gêneros e dificuldades
- "Especialista em Gênero" - Foco em um gênero específico

Analise profundamente e retorne APENAS o JSON válido:
`;
  }

  /**
   * Resume dados do perfil para o prompt
   */
  getProfileSummary(profileData) {
    return `
- PSN ID: ${profileData.onlineId || 'N/A'}
- Nível: ${profileData.trophyLevel || 0}
- Progresso Geral: ${profileData.progress || 0}%
- Troféus Totais: ${profileData.earnedTrophies?.total || 0}
- Platinas: ${profileData.earnedTrophies?.platinum || 0}
- Ouros: ${profileData.earnedTrophies?.gold || 0}
- Pratas: ${profileData.earnedTrophies?.silver || 0}
- Bronzes: ${profileData.earnedTrophies?.bronze || 0}
`.trim();
  }

  /**
   * Resume dados dos jogos para o prompt
   */
  getGamesSummary(gamesData) {
    if (!gamesData?.trophies?.length) {
      return 'Nenhum jogo encontrado no perfil';
    }

    const games = gamesData.trophies.slice(0, 20); // Limitar para não exceder tokens
    const summary = games.map(game => 
      `- ${game.trophyTitle || game.name}: ${game.progress || 0}% completo`
    ).join('\n');

    return `Total de jogos: ${gamesData.trophies.length}\n${summary}`;
  }

  /**
   * Valida resposta do LLM
   */
  validateLLMResponse(analysis, profileData, gamesData) {
    const requiredFields = ['playerProfile', 'recommendations'];
    const profileRequired = ['archetype', 'description', 'characteristics'];
    
    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Resposta LLM inválida: campo ${field} faltando`);
      }
    }

    for (const field of profileRequired) {
      if (!analysis.playerProfile[field]) {
        throw new Error(`Resposta LLM inválida: campo playerProfile.${field} faltando`);
      }
    }

    // Garantir tipos corretos
    if (!Array.isArray(analysis.playerProfile.characteristics)) {
      analysis.playerProfile.characteristics = [];
    }

    if (!Array.isArray(analysis.recommendations)) {
      analysis.recommendations = [];
    }

    return analysis;
  }

  /**
   * Análise padrão caso LLM não esteja disponível
   */
  getDefaultAnalysis(profileData, gamesData) {
    const platinumCount = profileData?.earnedTrophies?.platinum || 0;
    const gamesCount = gamesData?.trophies?.length || 0;
    
    return {
      playerProfile: {
        archetype: 'Jogador PlayStation',
        description: `Perfil ativo com ${gamesCount} jogos e ${platinumCount} platinas conquistadas.`,
        characteristics: [
          'Colecionador de troféus',
          'Explorador de experiências gaming',
          'Membro da comunidade PlayStation'
        ]
      },
      recommendations: [
        {
          title: 'Continue sua jornada',
          description: 'Mantenha o excelente trabalho na conquista de troféus e exploração de novos jogos.'
        }
      ]
    };
  }
}

export const llmAnalysisService = new LLMAnalysisService();