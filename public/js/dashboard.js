class Dashboard {
    constructor() {
        this.analysisData = null;
        this.charts = {};
        this.init();
    }

    init() {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });

        this.loadAnalysisData();
        this.bindEvents();
    }

    loadAnalysisData() {
        const savedData = localStorage.getItem('psnAnalysisData');
        
        if (!savedData) {
            this.showError('Nenhum dado de análise encontrado. Por favor, realize uma nova análise.');
            return;
        }

        try {
            this.analysisData = JSON.parse(savedData);
            this.renderDashboard();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados da análise.');
        }
    }

    renderDashboard() {
        this.updateProfileInfo();
        this.updateScoreDisplay();
        this.renderCharts();
        this.renderGamesTable();
    }

    updateProfileInfo() {
        document.getElementById('profileUsername').textContent = this.analysisData.username;
        document.getElementById('profileGender').textContent = 
            this.analysisData.gender === 'male' ? 'Masculino' : 'Feminino';
        
        // Quick stats
        document.getElementById('quickPlatinas').textContent = 
            this.analysisData.profileDetails.platinasConquistadas;
        document.getElementById('quickCompletude').textContent = 
            this.analysisData.profileDetails.completudeMedia + '%';
        document.getElementById('quickRaras').textContent = 
            this.analysisData.profileDetails.platinasRarasCount;
        document.getElementById('quickGOTY').textContent = 
            this.analysisData.profileDetails.gotyCount;
    }

    updateScoreDisplay() {
        const totalScore = this.analysisData.totalScore;
        const rating = this.analysisData.rating;
        
        document.getElementById('totalScore').textContent = totalScore;
        document.getElementById('scoreRating').innerHTML = 
            `<span class="rating-text rating-${rating.toLowerCase()}">${rating}</span>`;
        
        // Update progress bar
        const progressBar = document.getElementById('scoreProgress');
        progressBar.style.width = `${totalScore}%`;
        progressBar.textContent = `${totalScore}%`;
        
        // Set progress bar color based on rating
        this.setProgressBarColor(progressBar, rating);
        
        // Update analysis date
        const analysisDate = new Date(this.analysisData.analysisDate);
        document.getElementById('analysisDate').textContent = 
            `Análise realizada em ${analysisDate.toLocaleDateString('pt-BR')}`;
    }

    setProgressBarColor(progressBar, rating) {
        const colors = {
            'Miado': '#ff6b6b',
            'Migué': '#4ecdc4', 
            'Miserê': '#45b7d1',
            'Miseravão': '#ffd700'
        };
        progressBar.style.background = colors[rating];
    }

    renderCharts() {
        this.renderScoreChart();
        this.renderProfileChart();
        this.renderAchievementChart();
    }

    renderScoreChart() {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        const breakdown = this.analysisData.scoreBreakdown;
        
        this.charts.score = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Platinas', 'Completude', 'Platinas Raras', 'Jogos GOTY', 'Alta Dificuldade'],
                datasets: [{
                    data: [
                        breakdown.platinas,
                        breakdown.completude, 
                        breakdown.platinasRaras,
                        breakdown.jogosGOTY,
                        breakdown.altaDificuldade
                    ],
                    backgroundColor: [
                        '#667eea', '#4facfe', '#43e97b', '#fa709a', '#ffd700'
                    ],
                    borderWidth: 2,
                    borderColor: '#2d2d2d'
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
                            padding: 20,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} pontos`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });

        // Update breakdown scores
        document.getElementById('scorePlatinas').textContent = breakdown.platinas;
        document.getElementById('scoreCompletude').textContent = breakdown.completude;
        document.getElementById('scoreRaras').textContent = breakdown.platinasRaras;
        document.getElementById('scoreGOTY').textContent = breakdown.jogosGOTY;
        document.getElementById('scoreDificuldade').textContent = breakdown.altaDificuldade;
    }

    renderProfileChart() {
        const ctx = document.getElementById('profileChart').getContext('2d');
        const details = this.analysisData.profileDetails;
        
        this.charts.profile = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total Jogos', 'Platinas', 'Raras', 'GOTY', 'Difíceis'],
                datasets: [{
                    label: 'Quantidade',
                    data: [
                        details.totalJogos,
                        details.platinasConquistadas,
                        details.platinasRarasCount,
                        details.gotyCount,
                        details.jogosDificeis
                    ],
                    backgroundColor: [
                        '#667eea', '#4facfe', '#43e97b', '#fa709a', '#ffd700'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#444'
                        },
                        ticks: {
                            color: '#fff'
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
                }
            }
        });
    }

    renderAchievementChart() {
        const ctx = document.getElementById('achievementChart').getContext('2d');
        
        // Simulate achievement distribution
        const achievementData = {
            bronze: Math.floor(Math.random() * 500) + 100,
            silver: Math.floor(Math.random() * 200) + 50,
            gold: Math.floor(Math.random() * 100) + 20,
            platinum: this.analysisData.profileDetails.platinasConquistadas
        };
        
        this.charts.achievement = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Bronze', 'Prata', 'Ouro', 'Platina'],
                datasets: [{
                    data: [
                        achievementData.bronze,
                        achievementData.silver,
                        achievementData.gold,
                        achievementData.platinum
                    ],
                    backgroundColor: [
                        '#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2'
                    ],
                    borderWidth: 2,
                    borderColor: '#2d2d2d'
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
                            padding: 20,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    renderGamesTable() {
        const tbody = document.getElementById('gamesTableBody');
        tbody.innerHTML = '';

        this.analysisData.games.forEach(game => {
            const row = this.createGameRow(game);
            tbody.appendChild(row);
        });
    }

    createGameRow(game) {
        const row = document.createElement('tr');
        row.className = 'game-row';
        
        // Set data attributes for filtering
        if (game.isPlatinum) row.dataset.platinum = 'true';
        if (game.isRare) row.dataset.rare = 'true';
        if (game.isGOTY) row.dataset.goty = 'true';

        const completionBar = `
            <div class="d-flex align-items-center">
                <div class="flex-grow-1 me-3">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${game.completion}%"></div>
                    </div>
                </div>
                <small>${game.completion}%</small>
            </div>
        `;

        const difficultyStars = this.generateDifficultyStars(game.difficulty);
        
        const statusBadges = [];
        if (game.isPlatinum) statusBadges.push('<span class="badge badge-platinum me-1">Platina</span>');
        if (game.isRare) statusBadges.push('<span class="badge badge-rare me-1">Raro</span>');
        if (game.isGOTY) statusBadges.push('<span class="badge badge-goty">GOTY</span>');

        row.innerHTML = `
            <td>
                <strong>${game.title}</strong>
            </td>
            <td>${completionBar}</td>
            <td>
                <div class="difficulty-stars">
                    ${difficultyStars}
                </div>
            </td>
            <td>${statusBadges.join('')}</td>
            <td>
                <i class="fas fa-trophy text-warning me-1"></i>
                ${Math.floor(Math.random() * 50) + 10}
            </td>
        `;

        return row;
    }

    generateDifficultyStars(difficulty) {
        const fullStars = Math.floor(difficulty / 2);
        const halfStar = difficulty % 2 === 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.target);
            });
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportAnalysis();
        });
    }

    handleFilter(button) {
        // Update active state
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const filter = button.dataset.filter;
        this.filterGamesTable(filter);
    }

    filterGamesTable(filter) {
        const rows = document.querySelectorAll('.game-row');
        
        rows.forEach(row => {
            switch (filter) {
                case 'platinum':
                    row.style.display = row.dataset.platinum ? 'table-row' : 'none';
                    break;
                case 'rare':
                    row.style.display = row.dataset.rare ? 'table-row' : 'none';
                    break;
                case 'goty':
                    row.style.display = row.dataset.goty ? 'table-row' : 'none';
                    break;
                default:
                    row.style.display = 'table-row';
            }
        });
    }

    exportAnalysis() {
        // Simulate export functionality
        const dataStr = JSON.stringify(this.analysisData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `psn-analysis-${this.analysisData.username}.json`;
        link.click();
        
        this.showToast('Análise exportada com sucesso!', 'success');
    }

    showError(message) {
        // Implement error display
        console.error(message);
    }

    showToast(message, type) {
        // Implement toast notifications
        console.log(`${type}: ${message}`);
    }
}

// Global functions for modal interactions
function shareAnalysis() {
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    const shareLink = document.getElementById('shareLink');
    
    shareLink.value = `${window.location.origin}${window.location.pathname}?share=${btoa(JSON.stringify(dashboard.analysisData))}`;
    modal.show();
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    
    // Show copied feedback
    const buttons = document.querySelectorAll('.share-buttons .btn');
    buttons[2].innerHTML = '<i class="fas fa-check me-1"></i>Copiado!';
    setTimeout(() => {
        buttons[2].innerHTML = '<i class="fas fa-link me-1"></i>Copiar Link';
    }, 2000);
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});