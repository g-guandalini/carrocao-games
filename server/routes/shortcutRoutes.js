const express = require('express');
const router = express.Router();
const { allAsync, runAsync, getAsync } = require('../database');

router.get('/shortcuts', async (_req, res) => {
    try { res.json(await allAsync('SELECT id, code, label, context, key_value AS keyValue, enabled FROM shortcuts ORDER BY context, id')); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/admin/shortcuts', async (_req, res) => {
    try { res.json(await allAsync('SELECT id, code, label, context, key_value AS keyValue, enabled FROM shortcuts ORDER BY context, id')); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/admin/shortcuts/:id', async (req, res) => {
    const { keyValue, enabled = true } = req.body;
    if (!keyValue || typeof keyValue !== 'string') return res.status(400).json({ error: 'A tecla é obrigatória.' });
    try {
        const current = await getAsync('SELECT context FROM shortcuts WHERE id = ?', [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Atalho não encontrado.' });
        const duplicate = await getAsync(
            'SELECT id, label FROM shortcuts WHERE context = ? AND key_value = ? AND id != ?',
            [current.context, keyValue, req.params.id]
        );
        if (duplicate) return res.status(409).json({ error: `A tecla já está sendo usada por "${duplicate.label}" neste contexto.` });
        await runAsync('UPDATE shortcuts SET key_value = ?, enabled = ? WHERE id = ?', [keyValue, enabled ? 1 : 0, req.params.id]);
        res.json(await getAsync('SELECT id, code, label, context, key_value AS keyValue, enabled FROM shortcuts WHERE id = ?', [req.params.id]));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
