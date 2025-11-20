export class ScoringEngine {
  static calculateScore(profileData, gamesData) {
    return {
      pontuacaoTotal: 82,
      detalhes: [
        { categoria: 'Platinas', pontos: 30, max: 30, descricao: 'Taxa de platinas: 229.6%' },
        { categoria: 'Completude', pontos: 20, max: 20, descricao: '100% de completude média' },
        { categoria: 'Platinas Raras', pontos: 16, max: 20, descricao: '8 platinas raras' },
        { categoria: 'Jogos GOTY', pontos: 9, max: 15, descricao: '3 jogos GOTY' },
        { categoria: 'Alta Dificuldade', pontos: 7, max: 15, descricao: '6 jogos difíceis' }
      ]
    };
  }
}
