// server/index.ts
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase, getDb, runAsync, allAsync, getAsync } = require('./database'); 

const categoryRoutes = require('./routes/categoryRoutes');
const imagemOcultaRoutes = require('./routes/imagemOcultaRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Configuração para servir arquivos estáticos ---
// CORREÇÃO AQUI: A pasta 'public' agora é um subdiretório da pasta 'server'.
// `__dirname` em `server/index.ts` é o diretório `server`.
const publicPath = path.join(__dirname, '..', 'public'); 
// Garante que a pasta public/characters exista dentro de server/public
const charactersUploadPath = path.join(publicPath, 'characters');
if (!fs.existsSync(charactersUploadPath)) {
    fs.mkdirSync(charactersUploadPath, { recursive: true });
    console.log(`Pasta de upload de imagens criada em: ${charactersUploadPath}`);
}
app.use(express.static(publicPath));
console.log(`Servindo arquivos estáticos de: ${publicPath} na raiz URL '/' do servidor Express.`);
// --- Fim da configuração de arquivos estáticos ---

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Imagem Oculta API está online!');
});

// Rota para obter todos os itens de imagem oculta (para o jogo)
app.get('/api/imagem-oculta/characters', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }
    try {
        const rows = await allAsync("SELECT * FROM imagem_oculta", []);
        res.json({ characters: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rotas para SCORES
app.get('/api/scores', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }
    try {
        const rows = await allAsync("SELECT team, points FROM scores", []);
        const formattedScores = rows.reduce((acc, current) => {
            acc[current.team] = current.points;
            return acc;
        }, {});
        res.json(formattedScores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/scores/update', async (req, res) => {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    }

    const { team, pointsToAdd } = req.body;

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

// Monta os roteadores de CRUD sob o prefixo /api/admin
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/imagem-oculta', imagemOcultaRoutes);

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
        process.exit(1);
    });