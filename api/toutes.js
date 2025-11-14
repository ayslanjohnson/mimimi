const express = require('express');
const PSNProfileAnalyzer = require('./profile');
const router = express.Router();

const analyzer = new PSNProfileAnalyzer();

router.post('/analyze', async (req, res) => {
    try {
        const { username, gender } = req.body;
        
        if (!username) {
            return res.status(400).json({
                error: 'Nome de usuário é obrigatório'
            });
        }

        console.log(`📊 Solicitando análise para: ${username}`);
        const analysis = await analyzer.analyzeProfile(username, gender);
        
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na rota de análise:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;