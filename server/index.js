// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase, getDb, runAsync, allAsync, getAsync } = require('./database'); 

const categoryRoutes = require('./routes/categoryRoutes');
const imagemOcultaRoutes = require('./routes/imagemOcultaRoutes');
const conexaoRoutes = require('./routes/conexaoRoutes');
const bugRoutes = require('./routes/bugRoutes'); // Importar as novas rotas do BUG

const app = express();
const PORT = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

// --- Configuração de Caminhos ---
const projectRoot = path.join(__dirname, '..'); // Caminho para a raiz do projeto (carrocao-games)
const publicPath = path.join(projectRoot, 'public'); // Onde ficam as imagens de upload (originalmente)
const frontendBuildPath = path.join(projectRoot, 'dist'); // Onde o Vite gera o frontend de produção


// Garante que as pastas de upload existam
const charactersUploadPath = path.join(publicPath, 'characters');
if (!fs.existsSync(charactersUploadPath)) {
    fs.mkdirSync(charactersUploadPath, { recursive: true });
    console.log(`[Backend] Pasta de upload de imagens (personagens) criada em: ${charactersUploadPath}`);
}

const conexaoImagesUploadPath = path.join(publicPath, 'conexao_images');
if (!fs.existsSync(conexaoImagesUploadPath)) {
    fs.mkdirSync(conexaoImagesUploadPath, { recursive: true });
    console.log(`[Backend] Pasta de upload de imagens (conexão) criada em: ${conexaoImagesUploadPath}`);
}

// --- Servir arquivos estáticos (Uploads e APIs primeiro) ---

// 1. Servir as pastas de uploads em URLs específicas
// Isso permite que o frontend acesse imagens de upload como /characters/imagem.png
app.use('/characters', (req, res, next) => {
    // console.log(`[Backend] Servindo arquivo estático de personagens: ${req.url}`); // Debugging
    next();
}, express.static(charactersUploadPath));
console.log(`[Backend] Servindo imagens de personagens de: ${charactersUploadPath} em '/characters'`);

app.use('/conexao_images', (req, res, next) => {
    // console.log(`[Backend] Servindo arquivo estático de conexão: ${req.url}`); // Debugging
    next();
}, express.static(conexaoImagesUploadPath));
console.log(`[Backend] Servindo imagens de conexão de: ${conexaoImagesUploadPath} em '/conexao_images'`);

// --- Rotas da API (prioridade alta) ---

// Mover a rota de teste/status para /api/status para não conflitar com o frontend na raiz '/'
app.get('/api/status', (req, res) => {
    // console.log('[Backend] Recebida requisição GET /api/status'); // Debugging
    res.send('Servidor Imagem Oculta API está online!');
});

// Suas rotas existentes da API
app.get('/api/scores', async (req, res) => {
    // console.log('[Backend] Recebida requisição GET /api/scores'); // Debugging
    const db = getDb();
    if (!db) { return res.status(500).json({ error: 'Banco de dados não inicializado.' }); }
    try {
        const rows = await allAsync("SELECT team, points FROM scores", []);
        const formattedScores = rows.reduce((acc, current) => {
            acc[current.team] = current.points;
            return acc;
        }, {});
        res.json(formattedScores);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/scores/update', async (req, res) => {
    // console.log('[Backend] Recebida requisição POST /api/scores/update', req.body); // Debugging
    const db = getDb();
    if (!db) { return res.status(500).json({ error: 'Banco de dados não inicializado.' }); }
    const { team, pointsToAdd } = req.body;
    if (!team || typeof pointsToAdd !== 'number') {
        return res.status(400).json({ error: 'Dados inválidos para atualização de pontuação.' });
    }
    try {
        const result = await runAsync("UPDATE scores SET points = points + ? WHERE team = ?", [pointsToAdd, team]);
        if (result.changes === 0) {
            return res.status(404).json({ error: `Time ${team} não encontrado.` });
        }
        res.json({ message: `Pontuação do time ${team} atualizada com sucesso.`, changes: result.changes });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/scores/set', async (req, res) => { // NOVO: Rota para definir pontuação de um time
    // console.log('[Backend] Recebida requisição POST /api/scores/set', req.body); // Debugging
    const db = getDb();
    if (!db) { return res.status(500).json({ error: 'Banco de dados não inicializado.' }); }
    const { team, points } = req.body;
    if (!team || typeof points !== 'number') {
        return res.status(400).json({ error: 'Dados inválidos para definição de pontuação.' });
    }
    try {
        const result = await runAsync("UPDATE scores SET points = ? WHERE team = ?", [points, team]);
        if (result.changes === 0) {
            // Se o time não for encontrado, insere-o (garantindo que scores existam)
            await runAsync("INSERT INTO scores (team, points) VALUES (?, ?)", [team, points]);
        }
        res.json({ message: `Pontuação do time ${team} definida para ${points}.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/scores/reset', async (req, res) => {
    // console.log('[Backend] Recebida requisição POST /api/scores/reset'); // Debugging
    const db = getDb();
    if (!db) { return res.status(500).json({ error: 'Banco de dados não inicializado.' }); }
    try {
        const result = await runAsync("UPDATE scores SET points = 0", []);
        res.json({ message: 'Todas as pontuações foram resetadas para 0.', changes: result.changes });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/admin/categories', categoryRoutes);
app.use('/api', imagemOcultaRoutes);
app.use('/api', conexaoRoutes);
app.use('/api', bugRoutes); // Usar as novas rotas do BUG


// --- Servir arquivos estáticos do frontend (JS, CSS, imagens de assets) ---
// Este middleware servirá todos os arquivos da pasta 'dist' (como /assets/index-hash.js, /logo_sitio.ico)
// mas *não* o index.html por padrão. Isso é para garantir que a rota SPA abaixo
// tenha controle total sobre a entrega do index.html.
app.use((req, res, next) => {
    // console.log(`[Backend] Servindo arquivo estático do frontend: ${req.url}`); // Debugging
    next();
}, express.static(frontendBuildPath, {
    index: false // Impede que express.static sirva index.html automaticamente
}));
console.log(`[Backend] Servindo arquivos estáticos (exceto index.html) de: ${frontendBuildPath}`);


// Rota Catch-all para o frontend (SPA) - ESSA DEVE SER A ÚLTIMA FUNÇÃO NA FILA DE MIDDLEWARE
// Este middleware *sem um caminho explícito* será executado para QUALQUER requisição
// que não foi tratada por NENHUMA das rotas ou middlewares anteriores.
app.use((req, res) => {
    // console.log(`[Backend] Recebida requisição não tratada, servindo index.html: ${req.url}`); // Debugging
    const indexPath = path.join(frontendBuildPath, 'index.html');


    // Verifica se o arquivo index.html existe na pasta dist
    if (!fs.existsSync(indexPath)) {
        console.error(`[Backend] Erro: Arquivo index.html não encontrado em: ${indexPath}`);
        return res.status(500).send('Erro interno do servidor: Arquivo index.html do frontend de produção não encontrado.');
    }

    // LÊ o conteúdo do arquivo para ter certeza do que está sendo enviado
    fs.readFile(indexPath, 'utf8', (readErr, data) => {
        if (readErr) {
            console.error(`[Backend] Erro ao ler index.html em ${indexPath}:`, readErr);
            return res.status(500).send('Erro interno do servidor ao ler index.html.');
        }
    
        // console.log(`[Backend] Enviando index.html para ${req.url}`); // Debugging
        // Agora sim, envia o arquivo
        res.sendFile(indexPath, (sendErr) => {
            if (sendErr) {
                console.error(`[Backend] Erro ao enviar index.html para ${req.url}:`, sendErr);
                res.status(500).send('Erro interno do servidor ao carregar a aplicação.');
            } else {
                // console.log(`[Backend] index.html enviado com sucesso para ${req.url}`); // Debugging
            }
        });
    });
});


// Inicializa o banco de dados e depois inicia o servidor
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`[Backend] Servidor de backend rodando na porta ${PORT}`);
            console.log(`[Backend] Acesse http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[Backend] Erro fatal ao iniciar o servidor de backend:', err);
        process.exit(1);
    });