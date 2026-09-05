const express = require('express');
const router = express.Router();
const { runAsync, allAsync, getAsync } = require('../database');

const asBoolean = (value) => value === undefined ? 1 : (value ? 1 : 0);

router.get('/hid/config', async (req, res) => {
    try {
        const mappings = await allAsync(`
            SELECT m.id, m.name, m.input_code AS inputCode, m.output_key AS outputKey,
                   d.identifier AS deviceIdentifier, d.name AS deviceName
            FROM hid_mappings m
            LEFT JOIN hid_devices d ON d.id = m.device_id
            WHERE m.enabled = 1 AND (m.device_id IS NULL OR d.enabled = 1)
            ORDER BY m.id
        `);
        res.json(mappings);
    } catch (error) {
        console.error('[HID] Erro ao carregar configuração:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/admin/hid/devices', async (req, res) => {
    try { res.json(await allAsync('SELECT * FROM hid_devices ORDER BY name')); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/hid/devices', async (req, res) => {
    const { name, identifier = null, driverType = 'sdl', enabled = true } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome do dispositivo é obrigatório.' });
    try {
        const result = await runAsync(
            'INSERT INTO hid_devices (name, identifier, driver_type, enabled) VALUES (?, ?, ?, ?)',
            [name, identifier || null, driverType, asBoolean(enabled)]
        );
        res.status(201).json(await getAsync('SELECT * FROM hid_devices WHERE id = ?', [result.lastID]));
    } catch (error) {
        res.status(error.message.includes('UNIQUE') ? 409 : 500).json({ error: error.message });
    }
});

router.put('/admin/hid/devices/:id', async (req, res) => {
    const { name, identifier = null, driverType = 'sdl', enabled = true } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome do dispositivo é obrigatório.' });
    try {
        const result = await runAsync(
            'UPDATE hid_devices SET name = ?, identifier = ?, driver_type = ?, enabled = ? WHERE id = ?',
            [name, identifier || null, driverType, asBoolean(enabled), req.params.id]
        );
        if (!result.changes) return res.status(404).json({ error: 'Dispositivo não encontrado.' });
        res.json(await getAsync('SELECT * FROM hid_devices WHERE id = ?', [req.params.id]));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/admin/hid/devices/:id', async (req, res) => {
    try {
        const result = await runAsync('DELETE FROM hid_devices WHERE id = ?', [req.params.id]);
        if (!result.changes) return res.status(404).json({ error: 'Dispositivo não encontrado.' });
        res.json({ message: 'Dispositivo excluído com sucesso.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/admin/hid/mappings', async (req, res) => {
    try {
        res.json(await allAsync(`
            SELECT m.*, d.name AS deviceName
            FROM hid_mappings m LEFT JOIN hid_devices d ON d.id = m.device_id
            ORDER BY m.id
        `));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/hid/mappings', async (req, res) => {
    const { deviceId = null, name, inputCode, outputKey, enabled = true } = req.body;
    if (!name || !inputCode || !outputKey) return res.status(400).json({ error: 'Nome, entrada e tecla de saída são obrigatórios.' });
    try {
        const result = await runAsync(
            'INSERT INTO hid_mappings (device_id, name, input_code, output_key, enabled) VALUES (?, ?, ?, ?, ?)',
            [deviceId || null, name, inputCode, outputKey, asBoolean(enabled)]
        );
        res.status(201).json(await getAsync('SELECT * FROM hid_mappings WHERE id = ?', [result.lastID]));
    } catch (error) {
        res.status(error.message.includes('UNIQUE') ? 409 : 500).json({ error: error.message });
    }
});

router.put('/admin/hid/mappings/:id', async (req, res) => {
    const { deviceId = null, name, inputCode, outputKey, enabled = true } = req.body;
    if (!name || !inputCode || !outputKey) return res.status(400).json({ error: 'Nome, entrada e tecla de saída são obrigatórios.' });
    try {
        const result = await runAsync(
            'UPDATE hid_mappings SET device_id = ?, name = ?, input_code = ?, output_key = ?, enabled = ? WHERE id = ?',
            [deviceId || null, name, inputCode, outputKey, asBoolean(enabled), req.params.id]
        );
        if (!result.changes) return res.status(404).json({ error: 'Mapeamento não encontrado.' });
        res.json(await getAsync('SELECT * FROM hid_mappings WHERE id = ?', [req.params.id]));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/admin/hid/mappings/:id', async (req, res) => {
    try {
        const result = await runAsync('DELETE FROM hid_mappings WHERE id = ?', [req.params.id]);
        if (!result.changes) return res.status(404).json({ error: 'Mapeamento não encontrado.' });
        res.json({ message: 'Mapeamento excluído com sucesso.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
