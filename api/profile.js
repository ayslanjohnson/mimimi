const axios = require('axios');

class PSNProfileAnalyzer {
    constructor() {
        this.HF_API_KEY = process.env.HUGGINGFACE_API_KEY || 'your-huggingface-key';
        this.PSN_API_BASE = 'https://psn-api.achievements.app';
    }

    async analyzeProfile(username, gender) {
        try {
            console.log(`🔍 Iniciando análise do perfil: ${username}`);
            
            // 1. Buscar dados reais do PSN (simulação)
            const psnData = await this.fetchPSNData(username);
            
            // 2. Calcular pontuação detalhada
            const analysis = this.calculateDetailedScore(psnData, gender);
            
            // 3. Gerar análise textual com LLM
            const llmAnalysis = await this.generateLLMAnalysis(analysis);
            analysis.llmAnalysis = llmAnalysis;
            
            console.log(`✅ Análise concluída para ${username}. Score: ${analysis.totalScore}`);
            return analysis;
            
        } catch (error) {
            console.error('❌ Erro na análise do perfil:', error);
            return this.generateFallbackAnalysis(username, gender);
        }
    }

    async fetchPSNData(username) {
        // Simulação de dados reais do PSN - Em produção, integrar com API real
        return {
            username: username,
            totalGames: Math.floor(Math.random() * 200) + 50,
            platinumTrophies: Math.floor(Math.random() * 50),
            goldTrophies: Math.floor(Math.random() * 100) + 20,
            silverTrophies: Math.floor(Math.random() * 300) + 50,
            bronzeTrophies: Math.floor(Math.random() * 1000) + 100,
            completionRate: (Math.random() * 100).toFixed(1),
            rarePlatinums: Math.floor(Math.random() * 15),
            gotyGames: Math.floor(Math.random() * 10),
            difficultGames: Math.floor(Math.random() * 20),
            recentActivity: this.generateRecentActivity(),
            topGames: this.generateTopGames()
        };
    }

    calculateDetailedScore(psnData, gender) {
        // Cálculo detalhado da pontuação conforme especificação
        const scoreBreakdown = {
            platinas: this.calculatePlatinasScore(psnData),
            completude: this.calculateCompletudeScore(psnData),
            platinasRaras: this.calculateRarePlatinasScore(psnData),
            jogosGOTY: this.calculateGOTYScore(psnData),
            altaDificuldade: this.calculateDifficultyScore(psnData)
        };

        const totalScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);
        
        return {
            username: psnData.username,
            gender: gender,
            totalScore: Math.min(totalScore, 100), // Máximo 100 pontos
            rating: this.getRating(totalScore),
            analysisDate: new Date().toISOString(),
            scoreBreakdown: scoreBreakdown,
            profileDetails: {
                totalJogos: psnData.totalGames,
                platinasConquistadas: psnData.platinumTrophies,
                completudeMedia: psnData.completionRate,
                platinasRarasCount: psnData.rarePlatinums,
                gotyCount: psnData.gotyGames,
                jogosDificeis: psnData.difficultGames,
                ouroTrophies: psnData.goldTrophies,
                prataTrophies: psnData.silverTrophies,
                bronzeTrophies: psnData.bronzeTrophies
            },
            games: this.generateGameAnalysis(psnData.topGames),
            recentActivity: psnData.recentActivity
        };
    }

    calculatePlatinasScore(psnData) {
        const taxaPlatinas = (psnData.platinumTrophies / psnData.totalGames) * 100;
        let score = (taxaPlatinas * 0.3); // 30% do score máximo
        
        // Bônus por quantidade absoluta de platinas
        if (psnData.platinumTrophies >= 40) score += 10;
        else if (psnData.platinumTrophies >= 25) score += 7;
        else if (psnData.platinumTrophies >= 15) score += 4;
        else if (psnData.platinumTrophies >= 5) score += 2;
        
        return Math.min(Math.round(score), 30);
    }

    calculateCompletudeScore(psnData) {
        const completude = parseFloat(psnData.completionRate);
        let score = completude * 0.2; // 20% do score máximo
        
        // Bônus por completude alta
        if (completude >= 90) score += 5;
        else if (completude >= 80) score += 3;
        else if (completude >= 70) score += 1;
        
        return Math.min(Math.round(score), 20);
    }

    calculateRarePlatinasScore(psnData) {
        let score = psnData.rarePlatinums * 2; // 2 pontos por platina rara
        
        // Bônus por ter platinas muito raras (<5%)
        const veryRarePlats = Math.floor(psnData.rarePlatinums * 0.3);
        score += veryRarePlats * 3;
        
        return Math.min(Math.round(score), 20);
    }

    calculateGOTYScore(psnData) {
        let score = psnData.gotyGames * 3; // 3 pontos por GOTY
        
        // Bônus por múltiplos GOTYs
        if (psnData.gotyGames >= 8) score += 6;
        else if (psnData.gotyGames >= 5) score += 3;
        else if (psnData.gotyGames >= 3) score += 1;
        
        return Math.min(Math.round(score), 15);
    }

    calculateDifficultyScore(psnData) {
        let score = psnData.difficultGames * 2; // 2 pontos por jogo difícil
        
        // Bônus por jogos extremamente difíceis
        const extremeDifficulty = Math.floor(psnData.difficultGames * 0.4);
        score += extremeDifficulty * 3;
        
        return Math.min(Math.round(score), 15);
    }

    getRating(score) {
        if (score >= 91) return 'Miseravão';
        if (score >= 76) return 'Miserê';
        if (score >= 41) return 'Migué';
        return 'Miado';
    }

    async generateLLMAnalysis(analysis) {
        try {
            const prompt = this.createAnalysisPrompt(analysis);
            
            // Usando Hugging Face API gratuita (modelo GPT-2)
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/gpt2',
                {
                    inputs: prompt,
                    parameters: {
                        max_length: 300,
                        temperature: 0.8,
                        do_sample: true
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (response.data && response.data[0] && response.data[0].generated_text) {
                return this.cleanLLMResponse(response.data[0].generated_text, prompt);
            }
            
            throw new Error('Resposta da LLM vazia');
            
        } catch (error) {
            console.warn('LLM não disponível, usando análise padrão:', error.message);
            return this.generateDefaultAnalysis(analysis);
        }
    }

    createAnalysisPrompt(analysis) {
        return `Analise este perfil PSN de forma engraçada no estilo "Mi mi mi, PlayJEGUE":

Perfil: ${analysis.username}
Pontuação Total: ${analysis.totalScore}/100
Classificação: ${analysis.rating}
Estatísticas:
- ${analysis.profileDetails.platinasConquistadas} platinas de ${analysis.profileDetails.totalJogos} jogos
- Taxa de completude: ${analysis.profileDetails.completudeMedia}%
- ${analysis.profileDetails.platinasRarasCount} platinas raras
- ${analysis.profileDetails.gotyCount} jogos GOTY
- ${analysis.profileDetails.jogosDificeis} jogos de alta dificuldade

Análise humorística no estilo brasileiro:`;
    }

    cleanLLMResponse(response, prompt) {
        // Remove o prompt original da resposta
        let cleaned = response.replace(prompt, '').trim();
        
        // Garante que a análise tenha um tom humorístico
        if (!cleaned.includes('mi mi mi') && !cleaned.includes('PlayJEGUE')) {
            cleaned = `Mi mi mi, ${cleaned}`;
        }
        
        return cleaned.length > 0 ? cleaned : this.generateDefaultAnalysis();
    }

    generateDefaultAnalysis(analysis) {
        const templates = [
            `Mi mi mi! ${analysis.username} é um verdadeiro ${analysis.rating.toLowerCase()} das conquistas! Com ${analysis.profileDetails.platinasConquistadas} platinas, esse aí não perdoa nenhum jogo! PlayJEGUE!`,
            
            `Olha o ${analysis.username} aí! Classificado como ${analysis.rating} com ${analysis.totalScore} pontos. ${analysis.profileDetails.platinasRarasCount} platinas raras? Esse aí é brabo! Mi mi mi!`,
            
            `PlayJEGUE alert! ${analysis.username} mandou bem com ${analysis.profileDetails.completudeMedia}% de completude. É ${analysis.rating} pra cima de vocês! Mi mi mi!`,
            
            `Mi mi mi! ${analysis.username} tá com ${analysis.profileDetails.gotyCount} jogos GOTY na conta! Nota ${analysis.totalScore} - ${analysis.rating} confirmado! PlayJEGUE nas alturas!`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateRecentActivity() {
        const activities = [
            'Conquistou platina em Elden Ring',
            'Finalizou God of War Ragnarök',
            'Desbloqueou 10 conquistas raras',
            'Completou 100% em Horizon Forbidden West',
            'Zerou Demon\'s Souls no modo difícil'
        ];
        
        return activities.slice(0, Math.floor(Math.random() * 3) + 2);
    }

    generateTopGames() {
        const games = [
            { name: 'The Last of Us Part II', completion: 95, isPlatinum: true },
            { name: 'God of War', completion: 100, isPlatinum: true },
            { name: 'Elden Ring', completion: 85, isPlatinum: false },
            { name: 'Ghost of Tsushima', completion: 100, isPlatinum: true },
            { name: 'Spider-Man: Miles Morales', completion: 90, isPlatinum: true }
        ];
        
        return games.sort(() => Math.random() - 0.5).slice(0, 5);
    }

    generateGameAnalysis(topGames) {
        return topGames.map(game => ({
            title: game.name,
            completion: game.completion,
            isPlatinum: game.isPlatinum,
            isRare: Math.random() > 0.7,
            isGOTY: Math.random() > 0.8,
            difficulty: Math.floor(Math.random() * 10) + 1
        }));
    }

    generateFallbackAnalysis(username, gender) {
        console.log('Usando análise de fallback para:', username);
        
        const fallbackData = {
            username: username,
            gender: gender,
            totalScore: Math.floor(Math.random() * 101),
            rating: 'Migué',
            analysisDate: new Date().toISOString(),
            scoreBreakdown: {
                platinas: Math.floor(Math.random() * 31),
                completude: Math.floor(Math.random() * 21),
                platinasRaras: Math.floor(Math.random() * 21),
                jogosGOTY: Math.floor(Math.random() * 16),
                altaDificuldade: Math.floor(Math.random() * 16)
            },
            profileDetails: {
                totalJogos: Math.floor(Math.random() * 200) + 50,
                platinasConquistadas: Math.floor(Math.random() * 50),
                completudeMedia: (Math.random() * 100).toFixed(1),
                platinasRarasCount: Math.floor(Math.random() * 15),
                gotyCount: Math.floor(Math.random() * 10),
                jogosDificeis: Math.floor(Math.random() * 20)
            },
            games: this.generateGameAnalysis(this.generateTopGames()),
            llmAnalysis: this.generateDefaultAnalysis()
        };
        
        fallbackData.rating = this.getRating(fallbackData.totalScore);
        return fallbackData;
    }
}

module.exports = PSNProfileAnalyzer;