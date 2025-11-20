// backend/src/domain/repositories/analysis-repository.js
export class AnalysisRepository {
  constructor(database) {
    this.db = database;
  }

  async saveAnalysis(analysis) {
    const analysisEntity = {
      id: generateId(),
      psnId: analysis.psnId,
      analysisData: analysis.rawData,
      scoringResult: analysis.scoring,
      llmAnalysis: analysis.llmAnalysis,
      createdAt: new Date()
    };

    await this.db.insert(profileAnalysisTable).values(analysisEntity);
    return analysisEntity;
  }

  async findLatestAnalysis(psnId) {
    const result = await this.db
      .select()
      .from(profileAnalysisTable)
      .where(eq(profileAnalysisTable.psnId, psnId))
      .orderBy(desc(profileAnalysisTable.createdAt))
      .limit(1);

    return result[0] || null;
  }
}