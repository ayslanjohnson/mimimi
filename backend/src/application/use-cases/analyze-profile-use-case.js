// backend/src/application/use-cases/analyze-profile-use-case.js
export class AnalyzeProfileUseCase {
  constructor(
    psnDataProvider,
    scoringEngine,
    llmAnalysisService,
    analysisRepository
  ) {
    this.psnDataProvider = psnDataProvider;
    this.scoringEngine = scoringEngine;
    this.llmAnalysis = llmAnalysisService;
    this.repository = analysisRepository;
  }

  async execute(psnId, useMock = false) {
    // Validar se é mock
    if (useMock && psnId === 'MockProfile') {
      return this.getMockAnalysis(psnId);
    }

    try {
      // Buscar dados reais
      const [profileData, gamesData] = await Promise.all([
        this.psnDataProvider.getProfileData(psnId),
        this.psnDataProvider.getGamesData(psnId)
      ]);

      // Processar em paralelo para performance
      const [scoring, llmAnalysis] = await Promise.all([
        this.scoringEngine.calculateScore(profileData, gamesData),
        this.llmAnalysis.analyzeProfile(profileData, gamesData)
      ]);

      const analysis = {
        profileInfo: this.formatProfileInfo(profileData),
        trophyStats: this.formatTrophyStats(profileData),
        scoringSystem: scoring,
        ...llmAnalysis,
        rawData: { profile: profileData, games: gamesData }
      };

      // Salvar análise
      await this.repository.saveAnalysis({
        psnId,
        ...analysis
      });

      return analysis;

    } catch (error) {
      console.error(`Analysis failed for ${psnId}:`, error);
      throw new Error(`Não foi possível analisar o perfil: ${error.message}`);
    }
  }
}