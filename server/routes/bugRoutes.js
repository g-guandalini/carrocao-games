// server/routes/bugRoutes.js
const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database');

// Função auxiliar para formatar palavras BUG com suas categorias
async function formatBugWordsWithCategories(bugWordsItems) {
    const formattedItems = [];
    for (const item of bugWordsItems) {
        const categories = await allAsync(
            `SELECT c.id, c.name FROM categories c
             INNER JOIN category_bug_words cbw ON c.id = cbw.category_id
             WHERE cbw.bug_word_id = ?`,
            [item.id]
        );
        formattedItems.push({ ...item, categories });
    }
    return formattedItems;
}

// =========================================================
//                   ROTAS PARA O JOGO (frontend)
// =========================================================

// GET all bug words (para o jogo, com filtro por categorias)
router.get('/bug/words', async (req, res) => {
    try {
        let sql = "SELECT bw.* FROM bug_words bw";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_bug_words cbw ON bw.id = cbw.bug_word_id WHERE cbw.category_id IN (" + ids.map(() => '?').join(',') + ")";
                params.push(...ids);
                sql += " GROUP BY bw.id"; // Agrupar para evitar palavras duplicadas se pertencerem a múltiplas categorias selecionadas
            }
        }
        
        sql += " ORDER BY bw.order_idx IS NULL, bw.order_idx ASC, bw.id ASC";

        const bugWords = await allAsync(sql, params);
        res.json(bugWords);
    } catch (err) {
        console.error('Erro ao buscar palavras BUG para o jogo:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all bug boards (para o jogo, para selecionar um)
router.get('/bug/boards', async (req, res) => {
    try {
        const bugBoards = await allAsync("SELECT id, name, board_config FROM bug_boards");
        // Faz o parse da string JSON 'board_config' para um objeto JavaScript
        const formattedBoards = bugBoards.map(board => ({
            ...board,
            board_config: JSON.parse(board.board_config) 
        }));
        res.json(formattedBoards);
    } catch (err) {
        console.error('Erro ao buscar tabuleiros BUG para o jogo:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
//                   ROTAS PARA ADMIN (painel)
// =========================================================

// GET all bug words for admin (com categorias)
router.get('/admin/bug/words', async (req, res) => {
    try {
        let sql = "SELECT bw.* FROM bug_words bw";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_bug_words cbw ON bw.id = cbw.bug_word_id WHERE cbw.category_id IN (" + ids.map(() => '?').join(',') + ")";
                params.push(...ids);
                sql += " GROUP BY bw.id";
            }
        }
        
        sql += " ORDER BY bw.order_idx IS NULL, bw.order_idx ASC, bw.id ASC";

        const bugWords = await allAsync(sql, params);
        const formattedItems = await formatBugWordsWithCategories(bugWords);
        res.json(formattedItems);
    } catch (err) {
        console.error('Erro ao buscar palavras BUG para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET a specific bug word for admin
router.get('/admin/bug/words/:id', async (req, res) => {
    try {
        const item = await getAsync("SELECT * FROM bug_words WHERE id = ?", [req.params.id]);
        if (item) {
            const formattedItems = await formatBugWordsWithCategories([item]);
            res.json(formattedItems[0]);
        } else {
            res.status(404).json({ message: 'Palavra BUG não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao buscar palavra BUG por ID para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST a new bug word
router.post('/admin/bug/words', async (req, res) => {
    const { word, categoryIds, order_idx } = req.body || {};
    const processedWord = (word || '').trim().toUpperCase(); // Converte para maiúsculas para consistência
    const processedOrder = order_idx ? parseInt(order_idx, 10) : null; 

    if (!processedWord) {
        return res.status(400).json({ error: 'A palavra é obrigatória.' });
    }

    let bugWordId;
    try {
        await runAsync("BEGIN TRANSACTION");
        const result = await runAsync("INSERT INTO bug_words (word, order_idx) VALUES (?, ?)", [processedWord, processedOrder]);
        bugWordId = result.lastID;

        if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
            for (const categoryId of categoryIds) {
                await runAsync("INSERT INTO category_bug_words (category_id, bug_word_id) VALUES (?, ?)", [categoryId, bugWordId]);
            }
        }
        await runAsync("COMMIT"); 

        res.status(201).json({ id: bugWordId, word: processedWord, order_idx: processedOrder, categories: categoryIds || [] });
    } catch (dbErr) {
        await runAsync("ROLLBACK"); 
        console.error('Erro ao criar Palavra BUG no DB:', dbErr);
        // Verifica por erro de restrição de unicidade (SQLITE_CONSTRAINT_UNIQUE)
        if (dbErr.code === 'SQLITE_CONSTRAINT' && dbErr.message.includes('UNIQUE constraint failed: bug_words.word')) {
            return res.status(409).json({ error: `A palavra '${processedWord}' já existe.` });
        }
        res.status(500).json({ error: dbErr.message });
    }
});

// PUT (update) an existing bug word
router.put('/admin/bug/words/:id', async (req, res) => {
    const { id } = req.params;
    const { word, categoryIds, order_idx } = req.body || {};
    const processedWord = (word || '').trim().toUpperCase(); // Converte para maiúsculas
    const processedOrder = order_idx ? parseInt(order_idx, 10) : null; 

    if (!processedWord) {
        return res.status(400).json({ error: 'A palavra é obrigatória.' });
    }

    try {
        await runAsync("BEGIN TRANSACTION");

        const result = await runAsync(
            "UPDATE bug_words SET word = ?, order_idx = ? WHERE id = ?",
            [processedWord, processedOrder, id]
        );
        if (result.changes === 0) {
            await runAsync("ROLLBACK");
            return res.status(404).json({ message: 'Palavra BUG não encontrada.' });
        }

        await runAsync("DELETE FROM category_bug_words WHERE bug_word_id = ?", [id]);
        if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
            for (const categoryId of categoryIds) {
                await runAsync("INSERT INTO category_bug_words (category_id, bug_word_id) VALUES (?, ?)", [categoryId, id]);
            }
        }

        await runAsync("COMMIT");
        res.json({ message: 'Palavra BUG atualizada com sucesso.', id, word: processedWord, order_idx: processedOrder, categories: categoryIds || [] });
    } catch (dbErr) {
        await runAsync("ROLLBACK");
        console.error('Erro ao atualizar Palavra BUG no DB:', dbErr);
        if (dbErr.code === 'SQLITE_CONSTRAINT' && dbErr.message.includes('UNIQUE constraint failed: bug_words.word')) {
            return res.status(409).json({ error: `A palavra '${processedWord}' já existe.` });
        }
        res.status(500).json({ error: dbErr.message });
    }
});

// DELETE a bug word
router.delete('/admin/bug/words/:id', async (req, res) => {
    try {
        await runAsync("BEGIN TRANSACTION");
        const result = await runAsync("DELETE FROM bug_words WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            await runAsync("ROLLBACK");
            return res.status(404).json({ error: 'Palavra BUG não encontrada.' });
        }
        
        await runAsync("DELETE FROM category_bug_words WHERE bug_word_id = ?", [req.params.id]);

        await runAsync("COMMIT");
        res.json({ message: 'Palavra BUG excluída com sucesso.' });
    } catch (err) {
        await runAsync("ROLLBACK");
        console.error('Erro ao excluir Palavra BUG:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all bug boards for admin
router.get('/admin/bug/boards', async (req, res) => {
    try {
        const bugBoards = await allAsync("SELECT id, name, board_config FROM bug_boards");
        const formattedBoards = bugBoards.map(board => ({
            ...board,
            board_config: JSON.parse(board.board_config) // Faz o parse de volta
        }));
        res.json(formattedBoards);
    } catch (err) {
        console.error('Erro ao buscar tabuleiros BUG para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET a specific bug board for admin
router.get('/admin/bug/boards/:id', async (req, res) => {
    try {
        const board = await getAsync("SELECT id, name, board_config FROM bug_boards WHERE id = ?", [req.params.id]);
        if (board) {
            res.json({
                ...board,
                board_config: JSON.parse(board.board_config)
            });
        } else {
            res.status(404).json({ message: 'Tabuleiro BUG não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao buscar tabuleiro BUG por ID para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST a new bug board
router.post('/admin/bug/boards', async (req, res) => {
    const { name, board_config } = req.body || {};
    const processedName = (name || '').trim();

    if (!processedName || !board_config) {
        return res.status(400).json({ error: 'Nome e configuração do tabuleiro são obrigatórios.' });
    }
    // Converte a configuração do tabuleiro para string JSON antes de salvar
    let stringifiedBoardConfig;
    try {
        stringifiedBoardConfig = JSON.stringify(board_config);
    } catch (e) {
        return res.status(400).json({ error: 'Configuração do tabuleiro inválida. Deve ser um JSON válido.' });
    }

    try {
        const result = await runAsync("INSERT INTO bug_boards (name, board_config) VALUES (?, ?)", [processedName, stringifiedBoardConfig]);
        res.status(201).json({ id: result.lastID, name: processedName, board_config }); // Retorna a configuração como objeto
    } catch (dbErr) {
        console.error('Erro ao criar Tabuleiro BUG no DB:', dbErr);
        if (dbErr.code === 'SQLITE_CONSTRAINT' && dbErr.message.includes('UNIQUE constraint failed: bug_boards.name')) {
            return res.status(409).json({ error: `Um tabuleiro com o nome '${processedName}' já existe.` });
        }
        res.status(500).json({ error: dbErr.message });
    }
});

// PUT (update) an existing bug board
router.put('/admin/bug/boards/:id', async (req, res) => {
    const { id } = req.params;
    const { name, board_config } = req.body || {};
    const processedName = (name || '').trim();

    if (!processedName || !board_config) {
        return res.status(400).json({ error: 'Nome e configuração do tabuleiro são obrigatórios.' });
    }

    let stringifiedBoardConfig;
    try {
        stringifiedBoardConfig = JSON.stringify(board_config);
    } catch (e) {
        return res.status(400).json({ error: 'Configuração do tabuleiro inválida. Deve ser um JSON válido.' });
    }

    try {
        const result = await runAsync(
            "UPDATE bug_boards SET name = ?, board_config = ? WHERE id = ?",
            [processedName, stringifiedBoardConfig, id]
        );
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Tabuleiro BUG não encontrado.' });
        }
        res.json({ message: 'Tabuleiro BUG atualizado com sucesso.', id, name: processedName, board_config });
    } catch (dbErr) {
        console.error('Erro ao atualizar Tabuleiro BUG no DB:', dbErr);
        if (dbErr.code === 'SQLITE_CONSTRAINT' && dbErr.message.includes('UNIQUE constraint failed: bug_boards.name')) {
            return res.status(409).json({ error: `Um tabuleiro com o nome '${processedName}' já existe.` });
        }
        res.status(500).json({ error: dbErr.message });
    }
});

// DELETE a bug board
router.delete('/admin/bug/boards/:id', async (req, res) => {
    try {
        const result = await runAsync("DELETE FROM bug_boards WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Tabuleiro BUG não encontrado.' });
        }
        res.json({ message: 'Tabuleiro BUG excluído com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir Tabuleiro BUG:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;