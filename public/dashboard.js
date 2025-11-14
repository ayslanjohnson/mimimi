document.addEventListener('DOMContentLoaded', function() {
    const data = JSON.parse(localStorage.getItem('psnAnalysisData'));
    
    if (!data) {
        document.getElementById('dashboardContent').innerHTML = '<p>Dados não encontrados. <a href="index.html">Voltar</a></p>';
        return;
    }

    displayDashboard(data);
});

function displayDashboard(data) {
    const container = document.getElementById('dashboardContent');
    
    // Exemplo de exibição dos dados
    container.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="card text-center p-3 mb-4">
                    <h3>Pontuação Total</h3>
                    <h1 class="display-1">${data.totalScore}</h1>
                    <p class="lead">${data.rating}</p>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card p-3 mb-4">
                    <h3>Detalhes da Pontuação</h3>
                    <canvas id="scoreChart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="card p-3">
                    <h4>Platinas</h4>
                    <p>Total: ${data.platinumCount}</p>
                    <p>Taxa: ${data.platinumRate}%</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card p-3">
                    <h4>Completude</h4>
                    <p>Média: ${data.completionRate}%</p>
                </div>
            </div>
        </div>
        <!-- Adicione mais seções conforme necessário -->
    `;

    // Criar gráfico
    const ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Platinas', 'Completude', 'Platinas Raras', 'Jogos GOTY', 'Alta Dificuldade'],
            datasets: [{
                label: 'Pontuação por Categoria',
                data: [
                    data.scoreBreakdown.platinas,
                    data.scoreBreakdown.completude,
                    data.scoreBreakdown.platinasRaras,
                    data.scoreBreakdown.jogosGOTY,
                    data.scoreBreakdown.altaDificuldade
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 30
                }
            }
        }
    });
}
