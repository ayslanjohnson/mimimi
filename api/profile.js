const axios = require('axios');

class PSNProfileAnalyzer {
    constructor() {
        this.API_SOURCES = {
            TROPHIES_APP: {
                name: 'PlayStation Trophies API',
                baseURL: 'https://trophy-psn.onrender.com',
                endpoints: {
                    profile: (username) => `/v2/users/${username}/summary`,
                    trophies: (username) => `/v2/users/${username}/trophies`
                },
                enabled: true
            },
            ACHIEVEMENTS_APP: {
                name: 'PSN Achievements API',
                baseURL: 'https://psn-api.achievements.app',
                endpoints: {
                    profile: (username) => `/v2/player/${username}`,
                    trophies: (username) => `/v2/player/${username}/trophies`
                },
                enabled: true
            }
        };
        
        // Cache para evitar chamadas repetidas
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    async analyzeProfile(username, gender) {
        try {
            console.log(`🎮 Iniciando análise do perfil: ${username}`);
            
            // Verificar cache primeiro
            const cacheKey = `profile_${username}_${gender}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📦 Retornando dados do cache');
                return cached;
            }

            // Buscar dados de APIs reais com redundância
            const psnData = await this.fetchRealPSNData(username);
            
            if (!psnData) {
                throw new Error('Não foi possível obter dados do perfil PSN');
            }

            // Calcular pontuação detalhada
            const analysis = this.calculateDetailedScore(psnData, gender);
            analysis.dataSource = psnData.source;
            analysis.llmAnalysis = this.generateGamerAnalysis(analysis);

            // Salvar no cache
            this.saveToCache(cacheKey, analysis);
            
            console.log(`✅ Análise concluída para ${username}. Score: ${analysis.totalScore} (Fonte: ${psnData.source})`);
            return analysis;

        } catch (error) {
            console.error('❌ Erro na análise do perfil:', error);
            return this.generateFallbackAnalysis(username, gender);
        }
    }

    async fetchRealPSNData(username) {
        const sources = Object.entries(this.API_SOURCES).filter(([_, config]) => config.enabled);
        
        for (const [sourceName, config] of sources) {
            try {
                console.log(`🔍 Tentando fonte: ${config.name}`);
                const data = await this.fetchFromSource(username, config);
                
                if (data && this.validatePSNData(data)) {
                    console.log(`✅ Dados obtidos com sucesso de: ${config.name}`);
                    data.source = config.name;
                    return data;
                }
            } catch (error) {
                console.warn(`❌ Falha na fonte ${config.name}:`, error.message);
                continue;
            }
        }
        
        throw new Error('Todas as fontes de API falharam');
    }

    async fetchFromSource(username, config) {
        const timeout = 10000; // 10 segundos timeout
        
        try {
            const [profileResponse, trophiesResponse] = await Promise.all([
                axios.get(`${config.baseURL}${config.endpoints.profile(username)}`, { timeout }),
                axios.get(`${config.baseURL}${config.endpoints.trophies(username)}`, { timeout })
            ]);

            return this.normalizeData(profileResponse.data, trophiesResponse.data, config.name);
        } catch (error) {
            throw new Error(`API ${config.name} indisponível: ${error.message}`);
        }
    }

    normalizeData(profileData, trophiesData, source) {
        if (source === 'PlayStation Trophies API') {
            return this.normalizeTrophyPSNData(profileData, trophiesData);
        } else {
            return this.normalizeAchievementsAppData(profileData, trophiesData);
        }
    }

    normalizeTrophyPSNData(profileData, trophiesData) {
        const trophies = profileData.trophySummary?.earnedTrophies || {};
        const games = trophiesData.trophies || [];
        
        return {
            username: profileData.profile?.onlineId || 'N/A',
            totalGames: games.length,
            platinumTrophies: trophies.platinum || 0,
            goldTrophies: trophies.gold || 0,
            silverTrophies: trophies.silver || 0,
            bronzeTrophies: trophies.bronze || 0,
            completionRate: profileData.trophySummary?.progress || 0,
            level: profileData.profile?.trophyLevel || 1,
            rarePlatinums: this.calculateRarePlatinums(games),
            gotyGames: this.calculateGOTYGames(games),
            difficultGames: this.calculateDifficultGames(games),
            recentActivity: this.extractRecentActivity(games),
            topGames: this.extractTopGames(games),
            rawData: { profile: profileData, trophies: trophiesData }
        };
    }

    normalizeAchievementsAppData(profileData, trophiesData) {
        const games = trophiesData.games || [];
        const trophies = profileData.trophies || {};
        
        return {
            username: profileData.username || 'N/A',
            totalGames: games.length,
            platinumTrophies: trophies.platinum || 0,
            goldTrophies: trophies.gold || 0,
            silverTrophies: trophies.silver || 0,
            bronzeTrophies: trophies.bronze || 0,
            completionRate: profileData.completionRate || 0,
            level: profileData.level || 1,
            rarePlatinums: this.calculateRarePlatinums(games),
            gotyGames: this.calculateGOTYGames(games),
            difficultGames: this.calculateDifficultGames(games),
            recentActivity: this.extractRecentActivity(games),
            topGames: this.extractTopGames(games),
            rawData: { profile: profileData, trophies: trophiesData }
        };
    }

    calculateRarePlatinums(games) {
        // Simulação - em produção, analisar raridade real das platinas
        return games.filter(game => 
            game.earnedTrophies?.platinum && 
            Math.random() > 0.8 // 20% de chance de ser rara
        ).length;
    }

    calculateGOTYGames(games) {
        const gotyTitles = [
            'Madden NFL 2004', //2004
            'GTA: San Andreas', //2004
            'Resident Evil 4', //2005
            'The Elder Scrolls IV: Oblivion', //2006
            'BioShock', //2007
            'GTA IV', //2008
            'Uncharted 2', //2009
            'Red Dead Redemption', //2010
            'The Elder Scrolls V: Skyrim', //2011
            'The Walking Dead', //2012,
            'GTA V', //2013
            'Dragon Age: Inquisition', //2014
            'The Witcher 3', //2015
            'Overwatch', //2016
            'Zelda: Breath of the Wild', //2017
            'God of War', //2018
            'Sekiro: Shadows Die Twice', //2019
            'The Last of Us Part II', //2020
            'It Takes Two', //2021
            'Elden Ring', //2022
            'Baldur\'s Gate 3', //2023
            'Astro Bot', //2024
        ];
        
        return games.filter(game => 
            gotyTitles.some(title => 
                game.trophyTitleName?.includes(title) || game.name?.includes(title)
            )
        ).length;
    }

    calculateDifficultGames(games) {
        // Baseado em completude - jogos com baixa completude são considerados difíceis
        return games.filter(game => {
            const completion = game.progress || Math.random() * 100;
            return completion < 30; // Menos de 30% de completude = difícil
        }).length;
    }

    extractRecentActivity(games) {
        return games
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(game => `Jogando ${game.trophyTitleName || game.name}`);
    }

    extractTopGames(games) {
        return games
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
            .map(game => ({
                name: game.trophyTitleName || game.name || 'Game',
                completion: game.progress || Math.floor(Math.random() * 100),
                isPlatinum: !!game.earnedTrophies?.platinum
            }));
    }

    validatePSNData(data) {
        return data && 
               data.username && 
               data.username !== 'N/A' && 
               data.totalGames >= 0;
    }

    calculateDetailedScore(psnData, gender) {
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
            totalScore: Math.min(Math.round(totalScore), 100),
            rating: this.getRating(totalScore),
            analysisDate: new Date().toISOString(),
            scoreBreakdown: scoreBreakdown,
            profileDetails: {
                totalJogos: psnData.totalGames,
                platinasConquistadas: psnData.platinumTrophies,
                completudeMedia: psnData.completionRate.toFixed(1),
                platinasRarasCount: psnData.rarePlatinums,
                gotyCount: psnData.gotyGames,
                jogosDificeis: psnData.difficultGames,
                nivel: psnData.level,
                ouroTrophies: psnData.goldTrophies,
                prataTrophies: psnData.silverTrophies,
                bronzeTrophies: psnData.bronzeTrophies
            },
            games: this.generateGameAnalysis(psnData.topGames),
            recentActivity: psnData.recentActivity,
            rawData: psnData.rawData
        };
    }

    // ... (métodos de cálculo de score mantidos iguais) ...

    generateGamerAnalysis(analysis) {
        const templates = [
            `🎮 MI MI MI! ${analysis.username} é um ${analysis.rating} das conquistas! Com ${analysis.profileDetails.platinasConquistadas} platinas e ${analysis.totalScore} pontos, esse guerreiro não tem medo de desafio! 💪`,

            `🔥 PLAYJEGUE ALERT! ${analysis.username} dominou ${analysis.profileDetails.totalJogos} jogos e conquistou ${analysis.profileDetails.platinasConquistadas} platinas! Nota ${analysis.totalScore} - ${analysis.rating} confirmado! 🏆`,

            `⚡ ${analysis.username} TA ON FIRE! ${analysis.profileDetails.platinasRarasCount} platinas raras e ${analysis.profileDetails.gotyCount} GOTYs? É ${analysis.rating} pra cima de vocês! MI MI MI! 🚀`,

            `🌟 OLHA O ${analysis.username} AÍ! ${analysis.profileDetails.completudeMedia}% de completude média não é brincadeira! Classificação: ${analysis.rating} com ${analysis.totalScore} pontos! 🎯`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.cacheTimeout) {
            return item.data;
        }
        this.cache.delete(key);
        return null;
    }

    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    generateFallbackAnalysis(username, gender) {
        console.log('🔄 Usando análise de fallback para:', username);
        
        const fallbackData = this.generateMockAnalysis(username, gender);
        fallbackData.llmAnalysis = this.generateGamerAnalysis(fallbackData);
        fallbackData.dataSource = 'Fallback (APIs Offline)';
        
        return fallbackData;
    }

    generateMockAnalysis(username, gender) {
        // ... (mantido igual ao anterior) ...
    }
}

module.exports = PSNProfileAnalyzer;