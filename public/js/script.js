class PSNAnalysis {
    constructor() {
        this.currentLanguage = 'pt-BR';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadLanguage();
    }

    bindEvents() {
        document.getElementById('psnAnalysisForm').addEventListener('submit', (e) => {
            this.handleAnalysis(e);
        });
        
        document.getElementById('languageToggle').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleLanguage();
        });
    }

    async handleAnalysis(event) {
        event.preventDefault();
        
        const username = document.getElementById('psnUsername').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked').value;
        
        if (!username) {
            this.showAlert('Por favor, insira um nome de usuário PSN válido.', 'warning');
            return;
        }

        this.showLoading(true);
        
        try {
            const analysisData = await this.callAnalysisAPI(username, gender);
            this.saveAnalysisData(analysisData);
            this.redirectToDashboard();
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showAlert(
                'Erro ao analisar perfil. Verifique o nome de usuário e tente novamente.', 
                'danger'
            );
        } finally {
            this.showLoading(false);
        }
    }

    async callAnalysisAPI(username, gender) {
        // Simulação da chamada API - substituir pela API real
        const mockData = this.generateMockAnalysis(username, gender);
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return mockData;
    }

    generateMockAnalysis(username, gender) {
        const totalScore = Math.floor(Math.random() * 101);
        
        return {
            username,
            gender,
            totalScore,
            rating: this.getRating(totalScore),
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
            games: this.generateMockGames()
        };
    }

    generateMockGames() {
        const games = [];
        const gameTitles = [
            'The Last of Us Part II', 'God of War', 'Horizon Forbidden West',
            'Elden Ring', 'Cyberpunk 2077', 'Ghost of Tsushima',
            'Spider-Man: Miles Morales', 'Final Fantasy VII Remake', 'Demon\'s Souls',
            'Returnal', 'Ratchet & Clank: Rift Apart', 'Death Stranding'
        ];

        for (let i = 0; i < 8; i++) {
            games.push({
                title: gameTitles[Math.floor(Math.random() * gameTitles.length)],
                completion: (Math.random() * 100).toFixed(1),
                isPlatinum: Math.random() > 0.7,
                isRare: Math.random() > 0.8,
                isGOTY: Math.random() > 0.9,
                difficulty: Math.floor(Math.random() * 10) + 1
            });
        }

        return games;
    }

    getRating(score) {
        if (score >= 91) return 'Miseravão';
        if (score >= 76) return 'Miserê';
        if (score >= 41) return 'Migué';
        return 'Miado';
    }

    saveAnalysisData(data) {
        localStorage.setItem('psnAnalysisData', JSON.stringify(data));
        sessionStorage.setItem('lastAnalysis', new Date().toISOString());
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    showLoading(show) {
        const button = document.getElementById('analyzeBtn');
        const spinner = document.getElementById('loadingSpinner');
        
        if (show) {
            button.disabled = true;
            spinner.classList.remove('d-none');
        } else {
            button.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    showAlert(message, type) {
        // Implementar sistema de alertas com Bootstrap
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const form = document.getElementById('psnAnalysisForm');
        form.prepend(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'pt-BR' ? 'en-US' : 'pt-BR';
        this.loadLanguage();
    }

    loadLanguage() {
        // Implementar sistema de internacionalização
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translations[this.currentLanguage][key];
        });
    }

    get translations() {
        return {
            'pt-BR': {
                // Traduções em português
            },
            'en-US': {
                // Traduções em inglês
            }
        };
    }
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new PSNAnalysis();
});
