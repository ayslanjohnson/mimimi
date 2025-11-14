class PSNAnalysis {
    constructor() {
        this.currentLanguage = 'pt-BR';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadLanguage();
        this.initParticles();
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    initParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 1;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 25 + 15;
            const animationDelay = Math.random() * 5;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.animationDuration = `${animationDuration}s`;
            particle.style.animationDelay = `${animationDelay}s`;
            
            const colors = ['#00f3ff', '#b967ff', '#ff2a6d', '#05d9e8'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 15px ${color}`;
            
            particlesContainer.appendChild(particle);
        }
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
            // Chamar a API real
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, gender })
            });

            if (!response.ok) {
                throw new Error('Erro na requisição da API');
            }

            const analysisData = await response.json();
            
            if (analysisData.success) {
                this.saveAnalysisData(analysisData.data);
                this.redirectToDashboard();
            } else {
                throw new Error(analysisData.error || 'Erro desconhecido');
            }
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
            button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Analisando...';
        } else {
            button.disabled = false;
            spinner.classList.add('d-none');
            button.innerHTML = '<i class="bi bi-lightning-charge me-2"></i>Analisar Perfil';
        }
    }

    showAlert(message, type) {
        // Criar alerta estilizado
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-gaming alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
                <button type="button" class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        
        const form = document.getElementById('psnAnalysisForm');
        form.prepend(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'pt-BR' ? 'en-US' : 'pt-BR';
        this.loadLanguage();
        this.updateLanguageToggle();
    }

    updateLanguageToggle() {
        const toggle = document.getElementById('languageToggle');
        if (this.currentLanguage === 'pt-BR') {
            toggle.innerHTML = '<i class="bi bi-globe me-1"></i>PT-BR/EN-US';
        } else {
            toggle.innerHTML = '<i class="bi bi-globe me-1"></i>EN-US/PT-BR';
        }
    }

    loadLanguage() {
        // Sistema de internacionalização básico
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[this.currentLanguage][key]) {
                element.textContent = this.translations[this.currentLanguage][key];
            }
        });
    }

    get translations() {
        return {
            'pt-BR': {
                'hero.title': 'Mi mi mi, PlayJEGUE',
                'hero.subtitle': 'Sistema avançado de análise de perfis PlayStation com IA',
                'form.title': 'Analisar Perfil PSN',
                'form.username': 'Nome de usuário PSN',
                'form.username.placeholder': 'Ex: gamer123',
                'form.gender': 'Gênero',
                'form.gender.male': 'Masculino',
                'form.gender.female': 'Feminino',
                'form.button': 'Analisar Perfil',
                'form.footer': 'Suas informações estão seguras conosco',
                'rating.title': 'Sistema de Classificação',
                'rating.subtitle': 'Descubra em qual categoria você se encaixa',
                'features.title': 'Recursos Avançados',
                'features.subtitle': 'Tudo que você precisa para analisar seu perfil PSN'
            },
            'en-US': {
                'hero.title': 'Mi mi mi, PlayJEGUE',
                'hero.subtitle': 'Advanced PlayStation profile analysis system with AI',
                'form.title': 'Analyze PSN Profile',
                'form.username': 'PSN Username',
                'form.username.placeholder': 'Ex: gamer123',
                'form.gender': 'Gender',
                'form.gender.male': 'Male',
                'form.gender.female': 'Female',
                'form.button': 'Analyze Profile',
                'form.footer': 'Your information is safe with us',
                'rating.title': 'Rating System',
                'rating.subtitle': 'Discover which category you fit into',
                'features.title': 'Advanced Features',
                'features.subtitle': 'Everything you need to analyze your PSN profile'
            }
        };
    }
}

// CSS para alertas gaming
const style = document.createElement('style');
style.textContent = `
    .alert-gaming {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
        backdrop-filter: blur(10px);
    }
    
    .alert-warning {
        border-color: #ffd700;
        background: rgba(255, 215, 0, 0.1);
    }
    
    .alert-danger {
        border-color: #ff2a6d;
        background: rgba(255, 42, 109, 0.1);
    }
    
    .alert-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: white;
    }
    
    .alert-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        margin-left: 1rem;
    }
`;
document.head.appendChild(style);

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new PSNAnalysis();
});