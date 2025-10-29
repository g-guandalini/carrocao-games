// server/index.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase, getDb, runAsync, allAsync } = require('./database'); // Importa as novas funções

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Imagem Oculta API está online!');
});

// Rota para obter todos os itens de imagem oculta
app.get('/api/imagem-oculta/characters', async (req, res) => { // Marcado como async
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }
    try {
        const rows = await allAsync("SELECT * FROM imagem_oculta", []); // Usa allAsync
        res.json({ characters: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NOVA ROTA: Obter todas as pontuações
app.get('/api/scores', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }
    try {
        const rows = await allAsync("SELECT team, points FROM scores", []);
        // Formata os scores para um objeto mais conveniente para o frontend: { "Azul": 100, "Vermelho": 50, ... }
        const formattedScores = rows.reduce((acc, current) => {
            acc[current.team] = current.points;
            return acc;
        }, {});
        res.json(formattedScores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NOVA ROTA: Atualizar a pontuação de um time
app.post('/api/scores/update', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }

    const { team, pointsToAdd } = req.body; // Espera { team: 'Azul', pointsToAdd: 50 }

    if (!team || typeof pointsToAdd !== 'number') {
        return res.status(400).json({ error: 'Dados inválidos para atualização de pontuação.' });
    }

    try {
        const result = await runAsync(
            "UPDATE scores SET points = points + ? WHERE team = ?",
            [pointsToAdd, team]
        );
        if (result.changes === 0) {
            return res.status(404).json({ error: `Time ${team} não encontrado.` });
        }
        res.json({ message: `Pontuação do time ${team} atualizada com sucesso.`, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NOVA ROTA: Resetar todas as pontuações
app.post('/api/scores/reset', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }

    try {
        const result = await runAsync("UPDATE scores SET points = 0", []);
        res.json({ message: 'Todas as pontuações foram resetadas para 0.', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Inicializa o banco de dados e depois inicia o servidor
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor de backend rodando na porta ${PORT}`);
            console.log(`Acesse http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro fatal ao iniciar o servidor de backend:', err);
        process.exit(1); // Sai do processo se o DB não puder ser inicializado
    });