// server/routes/scoreRoutes.js
const express = require('express');
const router = express.Router();
const { allAsync, runAsync, getAsync } = require('../database');

// GET all scores for admin
router.get('/admin/scores', async (req, res) => {
    try {
        const scores = await allAsync("SELECT team, points FROM scores ORDER BY team");
        // Transforma o array de objetos em um objeto com chaves de equipe
        const scoresObject = scores.reduce((acc, curr) => {
            acc[curr.team] = curr.points;
            return acc;
        }, {});
        res.json(scoresObject); // Retorna o objeto { "RED": 100, "BLUE": 100, ... }
    } catch (err) {
        console.error('Erro ao buscar pontuações para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT (update) a specific team's score for admin
router.put('/admin/scores/:team', async (req, res) => {
    const { team } = req.params;
    const { points } = req.body; // Espera-se o valor exato da nova pontuação

    if (points === undefined || typeof points !== 'number') {
        return res.status(400).json({ error: 'Pontuação inválida fornecida.' });
    }

    try {
        const result = await runAsync(
            "UPDATE scores SET points = ? WHERE team = ?",
            [points, team]
        );
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Equipe não encontrada.' });
        }
        res.json({ message: `Pontuação da equipe ${team} atualizada para ${points}.` });
    } catch (err) {
        console.error(`Erro ao atualizar pontuação da equipe ${team}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// NOVA ROTA: POST para resetar todas as pontuações para um valor inicial (ex: 100)
router.post('/admin/scores/reset', async (req, res) => {
    try {
        // Assume que você quer resetar para 100, como no bugStore.ts
        await runAsync("UPDATE scores SET points = 100");
        res.json({ message: 'Todas as pontuações foram resetadas para 100.' });
    } catch (err) {
        console.error('Erro ao resetar todas as pontuações:', err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;