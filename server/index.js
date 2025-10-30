// server/index.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase, getDb, runAsync, allAsync, getAsync } = require('./database'); // Importa as novas funções

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

// --- NOVAS ROTAS ADMIN (CRUD Categorias) ---

// Obter todas as categorias
app.get('/api/admin/categories', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    try {
        const categories = await allAsync("SELECT id, name FROM categories ORDER BY name", []);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar nova categoria
app.post('/api/admin/categories', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync("INSERT INTO categories (name) VALUES (?)", [name]);
        res.status(201).json({ id: result.lastID, name });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Já existe uma categoria com este nome.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Atualizar categoria
app.put('/api/admin/categories/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria atualizada com sucesso.', id, name });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Já existe uma categoria com este nome.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Deletar categoria
app.delete('/api/admin/categories/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { id } = req.params;
    try {
        const result = await runAsync("DELETE FROM categories WHERE id = ?", [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria deletada com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- NOVAS ROTAS ADMIN (CRUD Imagem Oculta) ---

// Função auxiliar para buscar categorias de um item imagem_oculta
async function getCategoriesForImagemOculta(imagemOcultaId) {
    const db = getDb();
    const categories = await allAsync(
        `SELECT c.id, c.name FROM categories c
         INNER JOIN category_imagem_oculta cio ON c.id = cio.category_id
         WHERE cio.imagem_oculta_id = ?`,
        [imagemOcultaId]
    );
    return categories;
}

// Obter todos os itens de imagem_oculta com suas categorias
app.get('/api/admin/imagem-oculta', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    try {
        const items = await allAsync("SELECT id, hint, answer, imageUrl FROM imagem_oculta ORDER BY answer", []);
        const itemsWithCategories = await Promise.all(items.map(async (item) => {
            const categories = await getCategoriesForImagemOculta(item.id);
            return { ...item, categories };
        }));
        res.json(itemsWithCategories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obter um item de imagem_oculta por ID com suas categorias
app.get('/api/admin/imagem-oculta/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { id } = req.params;
    try {
        const item = await getAsync("SELECT id, hint, answer, imageUrl FROM imagem_oculta WHERE id = ?", [id]);
        if (!item) {
            return res.status(404).json({ error: 'Item de Imagem Oculta não encontrado.' });
        }
        const categories = await getCategoriesForImagemOculta(item.id);
        res.json({ ...item, categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar novo item de imagem_oculta
app.post('/api/admin/imagem-oculta', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { hint, answer, imageUrl, categoryIds = [] } = req.body;
    if (!hint || !answer || !imageUrl) {
        return res.status(400).json({ error: 'Hint, Answer e ImageUrl são obrigatórios.' });
    }

    try {
        // Iniciar transação para garantir atomicidade
        await runAsync("BEGIN TRANSACTION");

        const result = await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl) VALUES (?, ?, ?)", [hint, answer, imageUrl]);
        const imagemOcultaId = result.lastID;

        for (const categoryId of categoryIds) {
            await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, imagemOcultaId]);
        }

        await runAsync("COMMIT"); // Finalizar transação
        const categories = await getCategoriesForImagemOculta(imagemOcultaId);
        res.status(201).json({ id: imagemOcultaId, hint, answer, imageUrl, categories });
    } catch (err) {
        await runAsync("ROLLBACK"); // Reverter transação em caso de erro
        console.error('Erro ao criar item de imagem oculta:', err);
        res.status(500).json({ error: err.message });
    }
});

// Atualizar item de imagem_oculta
app.put('/api/admin/imagem-oculta/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { id } = req.params;
    const { hint, answer, imageUrl, categoryIds = [] } = req.body;
    if (!hint || !answer || !imageUrl) {
        return res.status(400).json({ error: 'Hint, Answer e ImageUrl são obrigatórios.' });
    }

    try {
        await runAsync("BEGIN TRANSACTION");

        const updateResult = await runAsync(
            "UPDATE imagem_oculta SET hint = ?, answer = ?, imageUrl = ? WHERE id = ?",
            [hint, answer, imageUrl, id]
        );
        if (updateResult.changes === 0) {
            await runAsync("ROLLBACK");
            return res.status(404).json({ error: 'Item de Imagem Oculta não encontrado.' });
        }

        // Deleta todas as associações de categoria existentes para este item
        await runAsync("DELETE FROM category_imagem_oculta WHERE imagem_oculta_id = ?", [id]);

        // Insere as novas associações de categoria
        for (const categoryId of categoryIds) {
            await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, id]);
        }

        await runAsync("COMMIT");
        const categories = await getCategoriesForImagemOculta(id);
        res.json({ id, hint, answer, imageUrl, categories });
    } catch (err) {
        await runAsync("ROLLBACK");
        console.error('Erro ao atualizar item de imagem oculta:', err);
        res.status(500).json({ error: err.message });
    }
});

// Deletar item de imagem_oculta
app.delete('/api/admin/imagem-oculta/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Banco de dados não inicializado.' });
    const { id } = req.params;
    try {
        const result = await runAsync("DELETE FROM imagem_oculta WHERE id = ?", [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item de Imagem Oculta não encontrado.' });
        }
        res.json({ message: 'Item de Imagem Oculta deletado com sucesso.' });
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
        process.exit(1);
    });