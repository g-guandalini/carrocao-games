// server/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database'); // Ajuste no path para database

// GET todas as categorias
router.get('/', async (req, res) => {
    try {
        const categories = await allAsync("SELECT * FROM categories ORDER BY name ASC");
        res.json(categories);
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET categoria por ID
router.get('/:id', async (req, res) => {
    try {
        const category = await getAsync("SELECT * FROM categories WHERE id = ?", [req.params.id]);
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
router.post('/', async (req, res) => {
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
        console.error('Erro ao criar categoria:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT atualizar categoria
router.put('/:id', async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        if (result.changes > 0) {
            res.json({ message: 'Categoria atualizada com sucesso.' });
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