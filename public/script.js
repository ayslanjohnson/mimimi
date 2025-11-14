document.getElementById('analysisForm').addEventListener('submit', analyzeProfile);

async function analyzeProfile(event) {
    event.preventDefault();
    
    const username = document.getElementById('psnUsername').value.trim();
    if (!username) {
        alert('Por favor, insira um nome de usuário PSN.');
        return;
    }

    // Mostrar loading (opcional)
    // ...

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        });

        if (!response.ok) {
            throw new Error('Erro na análise do perfil');
        }

        const data = await response.json();

        // Armazenar os dados para a dashboard
        localStorage.setItem('psnAnalysisData', JSON.stringify(data));

        // Redirecionar para a dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao analisar o perfil. Tente novamente.');
    }
}
