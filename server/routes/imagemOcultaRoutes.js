// server/routes/imagemOcultaRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runAsync, getAsync, allAsync } = require('../database');
const createUploader = require('../utils/upload'); // AGORA: Importa a função fábrica
const upload = createUploader('characters'); // AGORA: Cria um uploader para a pasta 'characters'
const multer = require('multer'); // Importar multer para MulterError

// Função auxiliar para obter o caminho completo do arquivo de imagem
const getFullPath = (imagePath) => {
    // Note: o caminho no DB deve ser '/characters/...'
    if (!imagePath || !imagePath.startsWith('/characters/')) {
        return null;
    }
    // Constrói o caminho completo no sistema de arquivos
    return path.join(__dirname, '..', '..', 'public', imagePath);
};

// Função auxiliar para formatar itens de Imagem Oculta com suas categorias
async function formatImagemOcultaWithCategories(imagemOcultaItems) {
    const formattedItems = [];
    for (const item of imagemOcultaItems) {
        const categories = await allAsync(
            `SELECT c.id, c.name FROM categories c
             INNER JOIN category_imagem_oculta cim ON c.id = cim.category_id
             WHERE cim.imagem_oculta_id = ?`,
            [item.id]
        );
        formattedItems.push({ ...item, categories });
    }
    return formattedItems;
}

// GET todas as imagens ocultas com suas categorias, ordenadas
// CORRIGIDO: Retorna sempre a estrutura completa com categorias
router.get('/', async (req, res) => {
    try {
        let sql = "SELECT io.* FROM imagem_oculta io";
        const params = [];
        const categoryIdsQuery = req.query.categoryIds;

        if (categoryIdsQuery) {
            const ids = String(categoryIdsQuery).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                sql += " INNER JOIN category_imagem_oculta cio ON io.id = cio.imagem_oculta_id WHERE cio.category_id IN (" + ids.map(() => '?').join(',') + ")";
                params.push(...ids);
                sql += " GROUP BY io.id"; // Garante que cada item aparece apenas uma vez
            }
        }
        
        sql += " ORDER BY io.order_idx IS NULL, io.order_idx ASC, io.id ASC";

        const imagemOculta = await allAsync(sql, params);
        // Agora, sempre formatamos os itens com categorias para o frontend do admin.
        // O `imagemOcultaStore` do jogo fará o mapeamento necessário.
        const formattedItems = await formatImagemOcultaWithCategories(imagemOculta);
        res.json(formattedItems);
    } catch (err) {
        console.error('Erro ao buscar imagens ocultas:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET imagem oculta por ID com suas categorias (mantido sem alterações)
router.get('/:id', async (req, res) => {
    try {
        const item = await getAsync("SELECT * FROM imagem_oculta WHERE id = ?", [req.params.id]);
        if (item) {
            const formattedItems = await formatImagemOcultaWithCategories([item]);
            res.json(formattedItems[0]);
        } else {
            res.status(404).json({ message: 'Imagem Oculta não encontrada.' });
        }
    } catch (err) {
        console.error('Erro ao buscar imagem oculta por ID:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST criar nova imagem oculta (mantido sem alterações significativas para este requisito)
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, async (err) => { // Invoca o multer e trata seus erros
        if (err) {
            console.error('Multer error during POST:', err);
            if (err instanceof multer.MulterError) {
                // Erros específicos do Multer (ex: FILE_TOO_LARGE, LIMIT_UNEXPECTED_FILE)
                return res.status(400).json({ error: err.message });
            } else if (err) {
                // Outros erros de upload
                return res.status(400).json({ error: err.message });
            }
        }

        // Usa um objeto vazio como fallback se req.body for undefined
        const { hint, answer, categoryIds, order } = req.body || {}; // Adicionado 'order'
        
        // Garante que hint e answer são strings e remove espaços em branco extras
        const processedHint = (hint || '').trim();
        const processedAnswer = (answer || '').trim();
        // Converte order para número ou null
        const processedOrder = order ? parseInt(order, 10) : null;

        if (!processedHint || !processedAnswer) {
            // Se o arquivo foi enviado, mas os campos de texto estão faltando, apaga o arquivo
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'Dica e Resposta são obrigatórias.' });
        }

        if (!req.file) {
            // Para criação, um arquivo é sempre esperado aqui.
            return res.status(400).json({ error: 'Um arquivo de imagem é obrigatório para um novo item.' });
        }

        const imageUrl = `/characters/${req.file.filename}`; // Caminho que será salvo no DB

        let imagemOcultaId;
        try {
            await runAsync("BEGIN TRANSACTION");
            // Adicionado 'order_idx' na query e nos parâmetros
            const result = await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl, order_idx) VALUES (?, ?, ?, ?)", [processedHint, processedAnswer, imageUrl, processedOrder]);
            imagemOcultaId = result.lastID;

            if (categoryIds) {
                // categoryIds vem como string JSON do FormData, precisa ser parseado
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, imagemOcultaId]);
                    }
                }
            }
            await runAsync("COMMIT"); 

            res.status(201).json({ id: imagemOcultaId, hint: processedHint, answer: processedAnswer, imageUrl, order_idx: processedOrder, categoryIds: categoryIds ? JSON.parse(categoryIds) : [] });
        } catch (dbErr) {
            await runAsync("ROLLBACK"); 
            console.error('Erro ao criar Imagem Oculta no DB:', dbErr);
            // Excluir a imagem se houver um erro no banco de dados
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: dbErr.message });
        }
    });
});

// PUT atualizar imagem oculta
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
        // Usa um objeto vazio como fallback se req.body for undefined
        const { hint, answer, categoryIds, existingImageUrl, order } = req.body || {}; // Adicionado 'order'

        const processedHint = (hint || '').trim();
        const processedAnswer = (answer || '').trim();
        // Converte order para número ou null
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

            if (req.file) { // Novo arquivo enviado
                newImageUrl = `/characters/${req.file.filename}`;
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

            // Adicionado 'order_idx' na query UPDATE e nos parâmetros
            const result = await runAsync(
                "UPDATE imagem_oculta SET hint = ?, answer = ?, imageUrl = ?, order_idx = ? WHERE id = ?",
                [processedHint, processedAnswer, newImageUrl, processedOrder, id]
            );
            if (result.changes === 0) {
                await runAsync("ROLLBACK");
                if (req.file) { fs.unlinkSync(req.file.path); }
                return res.status(404).json({ message: 'Item de Imagem Oculta não encontrado.' });
            }

            await runAsync("DELETE FROM category_imagem_oculta WHERE imagem_oculta_id = ?", [id]);

            if (categoryIds) {
                const parsedCategoryIds = JSON.parse(categoryIds);
                if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
                    for (const categoryId of parsedCategoryIds) {
                        await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, id]);
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

// DELETE imagem oculta
router.delete('/:id', async (req, res) => {
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
        
        res.json({ message: 'Imagem Oculta excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir Imagem Oculta:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;