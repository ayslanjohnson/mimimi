class PSNAnalysisPro {
    constructor() {
        this.backendUrl = window.location.hostname.includes('vercel.app') ? '/api' : 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAPIStatus();
    }

    bindEvents() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeProfile());
        
        document.getElementById('psnId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeProfile();
            }
        });
    }

    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            if (response.ok) {
                document.getElementById('apiStatus').textContent = 'ONLINE';
            } else {
                throw new Error('API não respondeu');
            }
        } catch (error) {
            document.getElementById('apiStatus').textContent = 'OFFLINE';
            document.getElementById('apiStatus').style.color = '#ff003c';
        }
    }

    async analyzeProfile() {
        const psnId = document.getElementById('psnId').value.trim();
        
        if (!psnId) {
            alert('Por favor, digite um PSN ID válido');
            return;
        }

        this.showLoading();

        try {
            // Usando dados mockados - em produção, descomente a linha abaixo
            // const analysis = await this.fetchProfileAnalysis(psnId);
            const analysis = this.getMockData(psnId);
            this.displayResults(analysis);
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showError('Erro ao analisar perfil. Tente novamente.');
        }
    }

    async fetchProfileAnalysis(psnId) {
        const response = await fetch(`${this.backendUrl}/profile/${encodeURIComponent(psnId)}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados');
        }
        return await response.json();
    }

    getMockData(psnId) {
        return {
            profileInfo: {
                name: psnId,
                level: 287,
                progress: 84,
                avatar: 'https://avatars.githubusercontent.com/u/1?v=4'
            },
            trophyStats: {
                total: 1542,
                platinum: 124,
                gold: 87,
                silver: 324,
                bronze: 1119
            },
            scoringSystem: {
                pontuacaoTotal: 82,
                detalhes: [
                    { categoria: 'Platinas', pontos: 30, max: 30, descricao: 'Taxa de platinas: 229.6%' },
                    { categoria: 'Completude', pontos: 20, max: 20, descricao: '100% de completude média' },
                    { categoria: 'Platinas Raras', pontos: 16, max: 20, descricao: '8 platinas raras' },
                    { categoria: 'Jogos GOTY', pontos: 9, max: 15, descricao: '3 jogos GOTY' },
                    { categoria: 'Alta Dificuldade', pontos: 7, max: 15, descricao: '6 jogos difíceis' }
                ]
            },
            classification: {
                type: 'Miserê',
                title: 'Miserê',
                description: 'Muitas platinas raras, jogos GOTY, notas altas no Metacritic, alta dificuldade (7/10+)',
                score: 82,
                emoji: '😻'
            }
        };
    }

    showLoading() {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-card">
                <h3>Analisando Perfil...</h3>
                <p>Por favor, aguarde enquanto analisamos seu perfil PSN.</p>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    showError(message) {
        const resultsSection = document.getElementById('results');
        resultsSection.innerHTML = `
            <div class="cyber-card" style="border-color: #ff003c;">
                <h3>Erro</h3>
                <p>${message}</p>
                <button class="cyber-primary-btn" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    displayResults(data) {
        const resultsSection = document.getElementById('results');
        
        const html = `
            <div class="cyber-card">
                <h2>Resultados da Análise</h2>
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <img src="${data.profileInfo.avatar}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 20px;">
                    <div>
                        <h3>${data.profileInfo.name}</h3>
                        <p>Nível: ${data.profileInfo.level} | Progresso: ${data.profileInfo.progress}%</p>
                        <div style="background: #00ff88; color: #000; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px;">
                            ${data.classification.emoji} ${data.classification.title}
                        </div>
                    </div>
                </div>
                
                <h3>Pontuação: ${data.scoringSystem.pontuacaoTotal}/100</h3>
                <div style="margin-top: 20px;">
                    ${data.scoringSystem.detalhes.map(item => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${item.categoria}</span>
                                <span>${item.pontos}/${item.max}</span>
                            </div>
                            <div style="background: #333; border-radius: 10px; overflow: hidden;">
                                <div style="background: #00f3ff; height: 20px; width: ${(item.pontos/item.max)*100}%; transition: width 1s;"></div>
                            </div>
                            <small style="color: #aaa;">${item.descricao}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        resultsSection.innerHTML = html;
        resultsSection.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PSNAnalysisPro();
});
