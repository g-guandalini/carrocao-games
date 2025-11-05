// server/routes/imagemOcultaRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runAsync, getAsync, allAsync } = require('../database');
const createUploader = require('../utils/upload'); 
const upload = createUploader('characters'); 
const multer = require('multer'); 

// Função auxiliar para obter o caminho completo do arquivo de imagem
const getFullPath = (imagePath) => {
    if (!imagePath || !imagePath.startsWith('/characters/')) {
        return null;
    }
    return path.join(__dirname, '..', '..', 'public', imagePath);
};

// Função auxiliar para formatar itens de Imagem Oculta com suas categorias
async function formatImagemOcultaWithCategories(imagemOcultaItems) {
    const formattedItems = [];
    for (const item of imagemOcultaItems) {
        const categories = await allAsync(
            `SELECT c.id, c.name FROM categories c
             INNER JOIN category_imagem_oculta cio ON c.id = cio.category_id -- CORRIGIDO: Usando category_imagem_oculta
             WHERE cio.imagem_oculta_id = ?`, // CORRIGIDO: Usando category_imagem_oculta_id
            [item.id]
        );
        formattedItems.push({ ...item, categories });
    }
    return formattedItems;
}

// =========================================================
//                   ROTAS PARA O JOGO (frontend)
// =========================================================
router.get('/imagem-oculta', async (req, res) => {
    try {
        let sql = "SELECT io.* FROM imagem_oculta io";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_imagem_oculta cio ON io.id = cio.imagem_oculta_id WHERE cio.category_id IN (" + ids.map(() => '?').join(',') + ")"; // CORRIGIDO: Usando category_imagem_oculta
                params.push(...ids);
                sql += " GROUP BY io.id"; 
            }
        }
        
        sql += " ORDER BY io.order_idx IS NULL, io.order_idx ASC, io.id ASC";

        const imagemOculta = await allAsync(sql, params);
        // Para o jogo, podemos retornar os itens sem as categorias aninhadas para otimização
        // Se o frontend do jogo precisar das categorias, a função formatImagemOcultaWithCategories pode ser usada.
        res.json(imagemOculta);
    } catch (err) {
        console.error('Erro ao buscar imagens ocultas para o jogo:', err);
        res.status(500).json({ error: err.message });
    }
});


// =========================================================
//                   ROTAS PARA ADMIN (painel)
// =========================================================
router.get('/admin/imagem-oculta', async (req, res) => {
    try {
        let sql = "SELECT io.* FROM imagem_oculta io";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_imagem_oculta cio ON io.id = cio.imagem_oculta_id WHERE cio.category_id IN (" + ids.map(() => '?').join(',') + ")"; // CORRIGIDO: Usando category_imagem_oculta
                params.push(...ids);
                sql += " GROUP BY io.id"; 
            }
        }
        
        sql += " ORDER BY io.order_idx IS NULL, io.order_idx ASC, io.id ASC";

        const imagemOculta = await allAsync(sql, params);
        const formattedItems = await formatImagemOcultaWithCategories(imagemOculta);
        res.json(formattedItems);
    } catch (err) {
        console.error('Erro ao buscar imagens ocultas para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/imagem-oculta/:id', async (req, res) => {
    try {
        const item = await getAsync("SELECT * FROM imagem_oculta WHERE id = ?", [req.params.id]);
        if (item) {
            const formattedItems = await formatImagemOcultaWithCategories([item]);
            res.json(formattedItems[0]);
        } else {
            res.status(404).json({ message: 'Imagem Oculta não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao buscar imagem oculta por ID para admin:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/imagem-oculta', (req, res, next) => {
    upload.single('image')(req, res, async (err) => { 
        if (err) {
            console.error('Multer error during POST:', err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }
        }

        const { hint, answer, categoryIds, order } = req.body || {}; 
        
        const processedHint = (hint || '').trim();
        const processedAnswer = (answer || '').trim();
        const processedOrder = order ? parseInt(order, 10) : null;

        if (!processedHint || !processedAnswer) {
            if (req.file) { fs.unlinkSync(req.file.path); }
            return res.status(400).json({ error: 'Dica e Resposta são obrigatórias.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Um arquivo de imagem é obrigatório para um novo item.' });
        }

        const imageUrl = `/characters/${req.file.filename}`; 

        let imagemOcultaId;
        try {
            await runAsync("BEGIN TRANSACTION");
            const result = await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl, order_idx) VALUES (?, ?, ?, ?)", [processedHint, processedAnswer, imageUrl, processedOrder]);
            imagemOcultaId = result.lastID;

            if (categoryIds) {
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, imagemOcultaId]); // CORRIGIDO: Usando category_imagem_oculta
                    }
                }
            }
            await runAsync("COMMIT"); 

            res.status(201).json({ id: imagemOcultaId, hint: processedHint, answer: processedAnswer, imageUrl, order_idx: processedOrder, categoryIds: categoryIds ? JSON.parse(categoryIds) : [] });
        } catch (dbErr) {
            await runAsync("ROLLBACK"); 
            console.error('Erro ao criar Imagem Oculta no DB:', dbErr);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: dbErr.message });
        }
    });
});

router.put('/admin/imagem-oculta/:id', (req, res, next) => {
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
        const { hint, answer, categoryIds, existingImageUrl, order } = req.body || {};

        const processedHint = (hint || '').trim();
        const processedAnswer = (answer || '').trim();
        const processedOrder = order ? parseInt(order, 10) : null;

        if (!processedHint || !processedAnswer) {
            if (req.file) { fs.unlinkSync(req.file.path); }
            return res.status(400).json({ error: 'Dica e Resposta são obrigatórias.' });
        }

        let newImageUrl = existingImageUrl;
        let oldImageUrlPath = null;

        try {
            await runAsync("BEGIN TRANSACTION");

            const existingItem = await getAsync("SELECT imageUrl FROM imagem_oculta WHERE id = ?", [id]);
            if (!existingItem) {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(404).json({ message: 'Item de Imagem Oculta não encontrado.' });
            }
            oldImageUrlPath = existingItem.imageUrl;

            if (req.file) { 
                newImageUrl = `/characters/${req.file.filename}`;
                if (oldImageUrlPath && getFullPath(oldImageUrlPath) !== getFullPath(newImageUrl)) {
                    const fullOldImagePath = getFullPath(oldImageUrlPath);
                    if (fullOldImagePath && fs.existsSync(fullOldImagePath)) {
                        fs.unlinkSync(fullOldImagePath);
                    }
                }
            } else if (existingImageUrl === '') { 
                 if (oldImageUrlPath) {
                    const fullOldImagePath = getFullPath(oldImageUrlPath);
                    if (fullOldImagePath && fs.existsSync(fullOldImagePath)) {
                        fs.unlinkSync(fullOldImagePath);
                    }
                }
                newImageUrl = ''; 
            }
            if (!newImageUrl && existingImageUrl !== '') {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(400).json({ error: 'A imagem é obrigatória.' });
            }

            const result = await runAsync(
                "UPDATE imagem_oculta SET hint = ?, answer = ?, imageUrl = ?, order_idx = ? WHERE id = ?",
                [processedHint, processedAnswer, newImageUrl, processedOrder, id]
            );
            if (result.changes === 0) {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(404).json({ message: 'Item de Imagem Oculta não encontrado.' });
            }

            await runAsync("DELETE FROM category_imagem_oculta WHERE imagem_oculta_id = ?", [id]); // CORRIGIDO: Usando category_imagem_oculta
            if (categoryIds) {
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, id]); // CORRIGIDO: Usando category_imagem_oculta
                    }
                }
            }

            await runAsync("COMMIT");
            res.json({ message: 'Imagem Oculta atualizada com sucesso.', id, hint: processedHint, answer: processedAnswer, imageUrl: newImageUrl, order_idx: processedOrder, categoryIds: categoryIds ? JSON.parse(categoryIds) : [] });
        } catch (dbErr) {
            await runAsync("ROLLBACK");
            console.error('Erro ao atualizar Imagem Oculta no DB:', dbErr);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: dbErr.message });
        }
    });
});

router.delete('/admin/imagem-oculta/:id', async (req, res) => {
    try {
        const itemToDelete = await getAsync("SELECT imageUrl FROM imagem_oculta WHERE id = ?", [req.params.id]);
        if (!itemToDelete) {
            return res.status(404).json({ error: 'Item de Imagem Oculta não encontrado.' });
        }

        const result = await runAsync("DELETE FROM imagem_oculta WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item de Imagem Oculta não encontrado.' });
        }

        if (itemToDelete.imageUrl) {
            const fullImagePath = getFullPath(itemToDelete.imageUrl);
            if (fullImagePath && fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
                console.log(`Imagem excluída: ${fullImagePath}`);
            }
        }
        
        await runAsync("DELETE FROM category_imagem_oculta WHERE imagem_oculta_id = ?", [req.params.id]); // CORRIGIDO: Usando category_imagem_oculta

        res.json({ message: 'Imagem Oculta excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir Imagem Oculta:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;