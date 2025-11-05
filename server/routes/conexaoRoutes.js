// server/routes/conexaoRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runAsync, getAsync, allAsync } = require('../database');
const createUploader = require('../utils/upload'); 
const upload = createUploader('conexao_images'); 
const multer = require('multer'); 

// Função auxiliar para obter o caminho completo do arquivo de imagem
const getFullPath = (imagePath) => {
    // Note: o caminho no DB deve ser '/conexao_images/...'
    if (!imagePath || !imagePath.startsWith('/conexao_images/')) {
        return null;
    }
    // Constrói o caminho completo no sistema de arquivos
    return path.join(__dirname, '..', '..', 'public', imagePath);
};

// Função auxiliar para formatar itens de Conexão com suas categorias
async function formatConexaoWithCategories(conexaoItems) {
    const formattedItems = [];
    for (const item of conexaoItems) {
        const categories = await allAsync(
            `SELECT c.id, c.name FROM categories c
             INNER JOIN category_conexao cc ON c.id = cc.category_id
             WHERE cc.conexao_id = ?`,
            [item.id]
        );
        formattedItems.push({ ...item, categories });
    }
    return formattedItems;
}

// GET todas as conexões com suas categorias, ordenadas
router.get('/', async (req, res) => {
    try {
        let sql = "SELECT co.* FROM conexao co";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_conexao cc ON co.id = cc.conexao_id WHERE cc.category_id IN (" + ids.map(() => '?').join(',') + ")";
                params.push(...ids);
                sql += " GROUP BY co.id"; // Garante que cada item aparece apenas uma vez
            }
        }
        
        // =========================================================
        //          NOVA ORDENAÇÃO PADRÃO POR order_idx
        // =========================================================
        sql += " ORDER BY co.order_idx IS NULL, co.order_idx ASC, co.id ASC";
        // =========================================================
        //        FIM DA NOVA ORDENAÇÃO PADRÃO POR order_idx
        // =========================================================

        const conexao = await allAsync(sql, params);
        const formattedItems = await formatConexaoWithCategories(conexao);
        res.json(formattedItems);
    } catch (err) {
        console.error('Erro ao buscar conexões:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET conexão por ID com suas categorias (já retorna order_idx implicitamente se estiver na tabela)
router.get('/:id', async (req, res) => {
    try {
        const item = await getAsync("SELECT * FROM conexao WHERE id = ?", [req.params.id]);
        if (item) {
            const formattedItems = await formatConexaoWithCategories([item]);
            res.json(formattedItems[0]);
        } else {
            res.status(404).json({ message: 'Conexão não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao buscar conexão por ID:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST criar nova conexão
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, async (err) => { 
        if (err) {
            console.error('Multer error during POST:', err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }
        }

        // =========================================================
        //         Adicionado 'order' no req.body
        // =========================================================
        const { palavra, categoryIds, order } = req.body || {};
        const processedPalavra = (palavra || '').trim();
        const processedOrder = order ? parseInt(order, 10) : null; // Converte para número ou null
        // =========================================================
        //          FIM da adição 'order' no req.body
        // =========================================================

        if (!processedPalavra) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'Palavra é obrigatória.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Um arquivo de imagem é obrigatório para um novo item.' });
        }

        const imageUrl = `/conexao_images/${req.file.filename}`; // Caminho que será salvo no DB

        let conexaoId;
        try {
            await runAsync("BEGIN TRANSACTION");
            // =========================================================
            //  Adicionado 'order_idx' na query e nos parâmetros de INSERT
            // =========================================================
            const result = await runAsync("INSERT INTO conexao (palavra, imageUrl, order_idx) VALUES (?, ?, ?)", [processedPalavra, imageUrl, processedOrder]);
            // =========================================================
            //   FIM da adição 'order_idx' na query e nos parâmetros
            // =========================================================
            conexaoId = result.lastID;

            if (categoryIds) {
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_conexao (category_id, conexao_id) VALUES (?, ?)", [categoryId, conexaoId]);
                    }
                }
            }
            await runAsync("COMMIT"); 

            // =========================================================
            //  Adicionado 'order_idx' na resposta do POST
            // =========================================================
            res.status(201).json({ id: conexaoId, palavra: processedPalavra, imageUrl, order_idx: processedOrder, categoryIds: categoryIds ? JSON.parse(categoryIds) : [] });
            // =========================================================
            //   FIM da adição 'order_idx' na resposta do POST
            // =========================================================
        } catch (dbErr) {
            await runAsync("ROLLBACK"); 
            console.error('Erro ao criar Conexão no DB:', dbErr);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: dbErr.message });
        }
    });
});

// PUT atualizar conexão
router.put('/:id', (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer error during PUT:', err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }
        }

        const { id } = req.params;
        // =========================================================
        //         Adicionado 'order' no req.body
        // =========================================================
        const { palavra, categoryIds, existingImageUrl, order } = req.body || {};
        const processedPalavra = (palavra || '').trim();
        const processedOrder = order ? parseInt(order, 10) : null; // Converte para número ou null
        // =========================================================
        //          FIM da adição 'order' no req.body
        // =========================================================

        if (!processedPalavra) {
            if (req.file) { fs.unlinkSync(req.file.path); }
            return res.status(400).json({ error: 'Palavra é obrigatória.' });
        }

        let newImageUrl = existingImageUrl;
        let oldImageUrlPath = null;

        try {
            await runAsync("BEGIN TRANSACTION");

            const existingItem = await getAsync("SELECT imageUrl FROM conexao WHERE id = ?", [id]);
            if (!existingItem) {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(404).json({ message: 'Item de Conexão não encontrado.' });
            }
            oldImageUrlPath = existingItem.imageUrl;

            if (req.file) { // Novo arquivo enviado
                newImageUrl = `/conexao_images/${req.file.filename}`;
                // Excluir a imagem antiga se existir e for diferente da nova
                if (oldImageUrlPath && getFullPath(oldImageUrlPath) !== getFullPath(newImageUrl)) {
                    const fullOldImagePath = getFullPath(oldImageUrlPath);
                    if (fullOldImagePath && fs.existsSync(fullOldImagePath)) {
                        fs.unlinkSync(fullOldImagePath);
                    }
                }
            } else if (existingImageUrl === '') { // Imagem explicitamente removida pelo frontend
                 if (oldImageUrlPath) {
                    const fullOldImagePath = getFullPath(oldImageUrlPath);
                    if (fullOldImagePath && fs.existsSync(fullOldImagePath)) {
                        fs.unlinkSync(fullOldImagePath);
                    }
                }
                newImageUrl = ''; // Limpa o caminho da imagem no DB
            }
            // Se newImageUrl for nulo/vazio e não foi uma remoção explícita (existingImageUrl === ''), 
            // significa que o campo de imagem está faltando.
            if (!newImageUrl && existingImageUrl !== '') {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(400).json({ error: 'A imagem é obrigatória.' });
            }

            // =========================================================
            //  Adicionado 'order_idx' na query UPDATE e nos parâmetros
            // =========================================================
            const result = await runAsync(
                "UPDATE conexao SET palavra = ?, imageUrl = ?, order_idx = ? WHERE id = ?",
                [processedPalavra, newImageUrl, processedOrder, id]
            );
            // =========================================================
            //   FIM da adição 'order_idx' na query UPDATE e nos parâmetros
            // =========================================================
            if (result.changes === 0) {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(404).json({ message: 'Item de Conexão não encontrado.' });
            }

            await runAsync("DELETE FROM category_conexao WHERE conexao_id = ?", [id]);

            if (categoryIds) {
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_conexao (category_id, conexao_id) VALUES (?, ?)", [categoryId, id]);
                    }
                }
            }

            await runAsync("COMMIT");
            // =========================================================
            //  Adicionado 'order_idx' na resposta do PUT
            // =========================================================
            res.json({ message: 'Conexão atualizada com sucesso.', id, palavra: processedPalavra, imageUrl: newImageUrl, order_idx: processedOrder, categoryIds: categoryIds ? JSON.parse(categoryIds) : [] });
            // =========================================================
            //   FIM da adição 'order_idx' na resposta do PUT
            // =========================================================
        } catch (dbErr) {
            await runAsync("ROLLBACK");
            console.error('Erro ao atualizar Conexão no DB:', dbErr);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: dbErr.message });
        }
    });
});

// DELETE conexão
router.delete('/:id', async (req, res) => {
    try {
        const itemToDelete = await getAsync("SELECT imageUrl FROM conexao WHERE id = ?", [req.params.id]);
        if (!itemToDelete) {
            return res.status(404).json({ error: 'Item de Conexão não encontrado.' });
        }

        const result = await runAsync("DELETE FROM conexao WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item de Conexão não encontrado.' });
        }

        if (itemToDelete.imageUrl) {
            const fullImagePath = getFullPath(itemToDelete.imageUrl);
            if (fullImagePath && fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
                console.log(`Imagem excluída: ${fullImagePath}`);
            }
        }
        
        res.json({ message: 'Conexão excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir Conexão:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;