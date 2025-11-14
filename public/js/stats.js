class StatsPage {
    constructor() {
        this.analysisData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.loadAnalysisData();
        this.initParticles();
    }

    loadAnalysisData() {
        const savedData = localStorage.getItem('psnAnalysisData');
        
        if (!savedData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.analysisData = JSON.parse(savedData);
            this.renderAllCharts();
            this.updateStats();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError();
        }
    }

    renderAllCharts() {
        this.renderTrophyDistribution();
        this.renderLevelProgress();
        this.renderCompletionStats();
    }

    renderTrophyDistribution() {
        const ctx = document.getElementById('trophyDistributionChart').getContext('2d');
        const details = this.analysisData.profileDetails;

        this.charts.trophyDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Platina', 'Ouro', 'Prata', 'Bronze'],
                datasets: [{
                    data: [
                        details.platinasConquistadas,
                        details.ouroTrophies,
                        details.prataTrophies,
                        details.bronzeTrophies
                    ],
                    backgroundColor: [
                        '#E5E4E2', // Platina
                        '#FFD700', // Ouro
                        '#C0C0C0', // Prata
                        '#CD7F32'  // Bronze
                    ],
                    borderWidth: 2,
                    borderColor: '#0a0a16'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                family: 'Rajdhani',
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} trophies`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    renderLevelProgress() {
        const ctx = document.getElementById('levelProgressChart').getContext('2d');
        const level = this.analysisData.profileDetails.nivel || 1;
        const nextLevel = level + 1;
        const progress = (level % 1) * 100;

        this.charts.levelProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Progresso do Nível'],
                datasets: [{
                    label: `Nível ${Math.floor(level)} → ${nextLevel}`,
                    data: [progress],
                    backgroundColor: 'rgba(0, 243, 255, 0.8)',
                    borderColor: 'rgba(0, 243, 255, 1)',
                    borderWidth: 2,
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                family: 'Rajdhani',
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    renderCompletionStats() {
        const ctx = document.getElementById('completionStatsChart').getContext('2d');
        const details = this.analysisData.profileDetails;

        this.charts.completionStats = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Platinas', 'Raras', 'GOTY', 'Difíceis'],
                datasets: [{
                    label: 'Taxa de Completude',
                    data: [
                        (details.platinasConquistadas / details.totalJogos) * 100,
                        (details.platinasRarasCount / details.totalJogos) * 100,
                        (details.gotyCount / details.totalJogos) * 100,
                        (details.jogosDificeis / details.totalJogos) * 100
                    ],
                    borderColor: 'rgba(185, 103, 255, 1)',
                    backgroundColor: 'rgba(185, 103, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                family: 'Rajdhani',
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    updateStats() {
        const details = this.analysisData.profileDetails;
        
        document.getElementById('totalTrophies').textContent = 
            details.platinasConquistadas + details.ouroTrophies + 
            details.prataTrophies + details.bronzeTrophies;
        
        document.getElementById('completionRate').textContent = 
            details.completudeMedia + '%';
        
        document.getElementById('playerLevel').textContent = 
            details.nivel || 'N/A';
    }

    initParticles() {
        // Inicializar partículas (mesmo código do dashboard)
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Posição e tamanho aleatórios
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 20 + 10;
            const animationDelay = Math.random() * 5;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.animationDuration = `${animationDuration}s`;
            particle.style.animationDelay = `${animationDelay}s`;
            
            // Cor aleatória baseada no tema
            const colors = ['#00f3ff', '#b967ff', '#ff2a6d', '#05d9e8'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            particlesContainer.appendChild(particle);
        }
    }

    showError() {
        // Implementar mensagem de erro estilizada
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger gamer-card';
        alert.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erro ao carregar dados. Por favor, realize uma nova análise.
        `;
        document.querySelector('.container').prepend(alert);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new StatsPage();
});