const express = require('express');
const router = express.Router();
const { runAsync, allAsync, getAsync } = require('../database');

const asBoolean = (value) => value === undefined ? 1 : (value ? 1 : 0);
const TEAM_OUTPUTS = new Set(['blue', 'red', 'green', 'yellow']);
let hidEventSequence = 0;
const hidEvents = [];

router.get('/hid/config', async (req, res) => {
    try {
        const mappings = await allAsync(`
            SELECT m.id, m.name, m.input_code AS inputCode,
                   COALESCE(s.key_value, m.output_key) AS outputKey,
                   d.identifier AS deviceIdentifier, d.name AS deviceName
            FROM hid_mappings m
            LEFT JOIN hid_devices d ON d.id = m.device_id
            LEFT JOIN shortcuts s ON s.code = m.output_key
            WHERE m.enabled = 1 AND (m.device_id IS NULL OR d.enabled = 1)
              AND (m.output_key NOT LIKE 'team_%' OR (s.enabled = 1))
            ORDER BY m.id
        `);
        res.json(mappings);
    } catch (error) {
        console.error('[HID] Erro ao carregar configuração:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/hid/events', (req, res) => {
    const { key } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ error: 'A tecla do evento é obrigatória.' });
    hidEventSequence += 1;
    hidEvents.push({ sequence: hidEventSequence, key });
    if (hidEvents.length > 100) hidEvents.shift();
    res.status(202).json({ sequence: hidEventSequence });
});

router.get('/hid/events', (req, res) => {
    const after = Number(req.query.after || 0);
    res.json(hidEvents.filter(event => event.sequence > after));
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
        const mappings = await allAsync(`
            SELECT m.*, d.name AS deviceName
            FROM hid_mappings m LEFT JOIN hid_devices d ON d.id = m.device_id
            ORDER BY m.id
        `);
        res.json(mappings.map(mapping => ({
            ...mapping,
            outputTeam: mapping.output_key.startsWith('team_')
                ? mapping.output_key.slice(5)
                : ({ '1': 'blue', '2': 'red', '3': 'green', '4': 'yellow' }[mapping.output_key] || ''),
        })));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/hid/mappings', async (req, res) => {
    const { deviceId = null, name, inputCode, outputTeam, enabled = true } = req.body;
    if (!name || !inputCode || !TEAM_OUTPUTS.has(outputTeam)) return res.status(400).json({ error: 'Nome, entrada e equipe são obrigatórios.' });
    try {
        const result = await runAsync(
            'INSERT INTO hid_mappings (device_id, name, input_code, output_key, enabled) VALUES (?, ?, ?, ?, ?)',
            [deviceId || null, name, inputCode, `team_${outputTeam}`, asBoolean(enabled)]
        );
        res.status(201).json(await getAsync('SELECT * FROM hid_mappings WHERE id = ?', [result.lastID]));
    } catch (error) {
        res.status(error.message.includes('UNIQUE') ? 409 : 500).json({ error: error.message });
    }
});

router.put('/admin/hid/mappings/:id', async (req, res) => {
    const { deviceId = null, name, inputCode, outputTeam, enabled = true } = req.body;
    if (!name || !inputCode || !TEAM_OUTPUTS.has(outputTeam)) return res.status(400).json({ error: 'Nome, entrada e equipe são obrigatórios.' });
    try {
        const result = await runAsync(
            'UPDATE hid_mappings SET device_id = ?, name = ?, input_code = ?, output_key = ?, enabled = ? WHERE id = ?',
            [deviceId || null, name, inputCode, `team_${outputTeam}`, asBoolean(enabled), req.params.id]
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
