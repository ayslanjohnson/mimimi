renderProfileChart() {
    const ctx = document.getElementById('profileChart').getContext('2d');
    const details = this.analysisData.profileDetails;
    
    // Dados corrigidos - usando os valores reais do profileDetails
    const profileData = {
        labels: ['Total Jogos', 'Platinas', 'Raras', 'GOTY', 'Difíceis', 'Completude'],
        datasets: [{
            label: 'Estatísticas do Perfil',
            data: [
                details.totalJogos,
                details.platinasConquistadas,
                details.platinasRarasCount,
                details.gotyCount,
                details.jogosDificeis,
                parseFloat(details.completudeMedia) // Converte string para número
            ],
            backgroundColor: [
                '#667eea', '#4facfe', '#43e97b', '#fa709a', '#ffd700', '#a78bfa'
            ],
            borderWidth: 2,
            borderColor: '#2d2d2d'
        }]
    };

    // Destruir chart anterior se existir
    if (this.charts.profile) {
        this.charts.profile.destroy();
    }

    this.charts.profile = new Chart(ctx, {
        type: 'bar',
        data: profileData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Formatação especial para completude (adiciona %)
                                if (context.dataIndex === 5) {
                                    label += context.parsed.y + '%';
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#444'
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            // Para a escala Y, se for completude, mostra porcentagem
                            return value + (this.index === 5 ? '%' : '');
                        }.bind(this)
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#fff',
                        maxRotation: 45
                    }
                }
            }
        }
    });
}