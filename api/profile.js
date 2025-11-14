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

        // Lista completa de títulos GOTY desde 2004
        this.gotyTitles = [
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
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    // ... (outros métodos permanecem iguais) ...

    calculateGOTYGames(games) {
        let gotyCount = 0;
        
        games.forEach(game => {
            const gameName = game.trophyTitleName || game.name || '';
            if (this.isGOTYGame(gameName)) {
                gotyCount++;
            }
        });
        
        return gotyCount;
    }

    isGOTYGame(gameName) {
        if (!gameName) return false;
        
        const normalizedGameName = gameName.toLowerCase().trim();
        
        return this.gotyTitles.some(gotyTitle => {
            const normalizedGOTY = gotyTitle.toLowerCase().trim();
            return normalizedGameName.includes(normalizedGOTY) || 
                   normalizedGOTY.includes(normalizedGameName);
        });
    }

    // ... (restante do código permanece igual) ...
}

module.exports = PSNProfileAnalyzer;