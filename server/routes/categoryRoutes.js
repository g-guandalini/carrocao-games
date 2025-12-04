// server/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database');

// Middleware para processar os valores booleanos para o banco de dados (0 ou 1)
const processBooleanFields = (req, res, next) => {
    // Para POST e PUT, converte os valores de 'start' para 0 ou 1
    if (req.body.imagem_oculta_start !== undefined) {
        req.body.imagem_oculta_start = req.body.imagem_oculta_start ? 1 : 0;
    }
    if (req.body.conexao_start !== undefined) {
        req.body.conexao_start = req.body.conexao_start ? 1 : 0;
    }
    if (req.body.bug_start !== undefined) {
        req.body.bug_start = req.body.bug_start ? 1 : 0;
    }
    next();
};

// GET todas as categorias
router.get('/', async (req, res) => {
    try {
        // Selecionando explicitamente as novas colunas
        const categories = await allAsync("SELECT id, name, imagem_oculta_start, conexao_start, bug_start FROM categories ORDER BY name ASC", []);
        res.json(categories);
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET categoria por ID
router.get('/:id', async (req, res) => {
    try {
        // Selecionando explicitamente as novas colunas
        const category = await getAsync("SELECT id, name, imagem_oculta_start, conexao_start, bug_start FROM categories WHERE id = ?", [req.params.id]);
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Categoria não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao buscar categoria por ID:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST criar nova categoria
router.post('/', processBooleanFields, async (req, res) => {
    const { name, imagem_oculta_start = 0, conexao_start = 0, bug_start = 0 } = req.body; // Definindo defaults para 0
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync(
            "INSERT INTO categories (name, imagem_oculta_start, conexao_start, bug_start) VALUES (?, ?, ?, ?)",
            [name, imagem_oculta_start, conexao_start, bug_start]
        );
        res.status(201).json({ id: result.lastID, name, imagem_oculta_start, conexao_start, bug_start });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Já existe uma categoria com este nome.' });
        }
        console.error('Erro ao criar categoria:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT atualizar categoria
router.put('/:id', processBooleanFields, async (req, res) => {
    const { name, imagem_oculta_start, conexao_start, bug_start } = req.body;
    const { id } = req.params;

    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }

    // Construção dinâmica da query de UPDATE para incluir apenas campos fornecidos
    let updateFields = ['name = ?'];
    let params = [name];

    if (imagem_oculta_start !== undefined) {
        updateFields.push('imagem_oculta_start = ?');
        params.push(imagem_oculta_start);
    }
    if (conexao_start !== undefined) {
        updateFields.push('conexao_start = ?');
        params.push(conexao_start);
    }
    if (bug_start !== undefined) {
        updateFields.push('bug_start = ?');
        params.push(bug_start);
    }

    params.push(id); // O ID vai por último

    try {
        const result = await runAsync(
            `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );
        if (result.changes > 0) {
            // Retorna o estado atualizado da categoria
            const updatedCategory = await getAsync("SELECT id, name, imagem_oculta_start, conexao_start, bug_start FROM categories WHERE id = ?", [id]);
            res.json({ message: 'Categoria atualizada com sucesso.', ...updatedCategory });
        } else {
            res.status(404).json({ message: 'Categoria não encontrada.' });
        }
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Já existe uma categoria com este nome.' });
        }
        console.error('Erro ao atualizar categoria:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE categoria
router.delete('/:id', async (req, res) => {
    try {
        const result = await runAsync("DELETE FROM categories WHERE id = ?", [req.params.id]);
        if (result.changes > 0) {
            res.json({ message: 'Categoria excluída com sucesso.' });
        } else {
            res.status(404).json({ message: 'Categoria não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;