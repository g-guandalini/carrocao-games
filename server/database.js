// server/database.js
// O Electron usa as dependências instaladas na raiz. Se existir uma instalação
// legada em server/node_modules (por exemplo, compilada para Alpine/musl),
// tente a cópia compatível da raiz antes de falhar ao carregar o binding nativo.
let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (error) {
    if (error.code !== 'ERR_DLOPEN_FAILED') throw error;
    sqlite3 = require('../node_modules/sqlite3').verbose();
}
const path = require('path');
const fs = require('fs');

const INITIAL_SHORTCUTS = [
    ['home_admin', 'Entrada no ADM', 'Inicialização', 'A'],
    ['home_imagem_oculta', 'Iniciar Imagem Oculta', 'Inicialização', 'I'],
    ['home_conexao', 'Iniciar Conexão', 'Inicialização', 'C'],
    ['home_bug', 'Iniciar BUG', 'Inicialização', 'B'],
    ['home_clear_scores', 'Limpar pontuações', 'Inicialização', 'L'],
    ['general_space', 'Confirmar / Próxima rodada', 'Geral', 'Space'],
    ['general_escape', 'Voltar / Sair', 'Geral', 'Escape'],
    ['general_scoreboard', 'Abrir placar', 'Geral', 'P'],
    ['feedback_correct', 'Resposta correta', 'Resposta', 'O'],
    ['feedback_wrong', 'Resposta errada', 'Resposta', 'X'],
    ['team_blue', 'Equipe Azul', 'Equipes', '1'],
    ['team_red', 'Equipe Vermelha', 'Equipes', '2'],
    ['team_green', 'Equipe Verde', 'Equipes', '3'],
    ['team_yellow', 'Equipe Amarela', 'Equipes', '4'],
    ['bug_sorteio', 'Sortear opção', 'BUG - Sorteio', 'S'],
    ['bug_digit_1', 'Tecla 1 (opções/equipe)', 'BUG - Sorteio', '1'],
    ['bug_digit_2', 'Tecla 2 (opções/equipe)', 'BUG - Sorteio', '2'],
    ['bug_digit_3', 'Tecla 3 (opções/equipe)', 'BUG - Sorteio', '3'],
    ['bug_digit_4', 'Tecla 4 (opções/equipe)', 'BUG - Sorteio', '4'],
    ['bug_digit_5', 'Tecla 5 (opções/pontos)', 'BUG - Sorteio', '5'],
    ['bug_digit_6', 'Tecla 6 (opções)', 'BUG - Sorteio', '6'],
    ['board_row_a', 'Linha A', 'BUG - Tabuleiro', 'A'],
    ['board_row_b', 'Linha B', 'BUG - Tabuleiro', 'B'],
    ['board_row_c', 'Linha C', 'BUG - Tabuleiro', 'C'],
    ['board_row_d', 'Linha D', 'BUG - Tabuleiro', 'D'],
    ['board_digit_1', 'Coluna 1', 'BUG - Tabuleiro', '1'],
    ['board_digit_2', 'Coluna 2', 'BUG - Tabuleiro', '2'],
    ['board_digit_3', 'Coluna 3', 'BUG - Tabuleiro', '3'],
    ['board_digit_4', 'Coluna 4', 'BUG - Tabuleiro', '4'],
    ['board_digit_5', 'Coluna 5', 'BUG - Tabuleiro', '5'],
];

// No Electron, os dados ficam fora do pacote da aplicação para continuarem
// graváveis e sobreviverem a atualizações. Fora dele, mantém o local legado.
const DB_PATH = process.env.GAME_DB_PATH || path.join(__dirname, 'db', 'game.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

/**
 * Funções auxiliares para operações assíncronas no banco de dados.
 */
function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                console.error(`[DB Error] runAsync: ${sql}`, err); // Added error logging
                reject(err);
            }
            else resolve(this); // 'this' contém lastID e changes
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error(`[DB Error] getAsync: ${sql}`, err); // Added error logging
                reject(err);
            }
            else resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`[DB Error] allAsync: ${sql}`, err); // Added error logging
                reject(err);
            }
            else resolve(rows);
        });
    });
}

function closeDb() {
    return new Promise((resolve, reject) => {
        if (!db) return resolve();
        db.close((err) => {
            if (err) return reject(err);
            db = null;
            resolve();
        });
    });
}

function validateDatabaseFile(filePath) {
    return new Promise((resolve, reject) => {
        const candidate = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (openError) => {
            if (openError) return reject(openError);
            candidate.get('PRAGMA integrity_check', (checkError, row) => {
                candidate.close(() => {
                    if (checkError) return reject(checkError);
                    if (!row || row.integrity_check !== 'ok') {
                        return reject(new Error('O arquivo SQLite não passou na verificação de integridade.'));
                    }
                    resolve();
                });
            });
        });
    });
}

async function restoreDatabase(buffer) {
    const tempPath = `${DB_PATH}.restore-${Date.now()}`;
    const previousPath = `${DB_PATH}.before-restore`;
    fs.writeFileSync(tempPath, buffer);

    try {
        await validateDatabaseFile(tempPath);
        await closeDb();
        fs.copyFileSync(DB_PATH, previousPath);
        fs.copyFileSync(tempPath, DB_PATH);
        await connectDb();
        await createTables();
        await seedInitialData();
        fs.rmSync(previousPath, { force: true });
    } catch (error) {
        try {
            await closeDb();
            if (fs.existsSync(previousPath)) {
                fs.copyFileSync(previousPath, DB_PATH);
                fs.rmSync(previousPath, { force: true });
                await connectDb();
            }
        } catch (rollbackError) {
            console.error('[DB] Falha ao reverter restauração:', rollbackError);
        }
        throw error;
    } finally {
        fs.rmSync(tempPath, { force: true });
    }
}

/**
 * Conecta ao banco de dados SQLite. Se o arquivo não existir, ele será criado.
 */
function connectDb() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err.message);
                reject(err);
            } else {
                console.log('Conectado ao banco de dados SQLite em:', DB_PATH);
                resolve(db);
            }
        });
    });
}

/**
 * Cria as tabelas necessárias no banco de dados e adiciona colunas se estiverem faltando.
 */
async function createTables() {
    if (!db) {
        await connectDb(); // Garante que a conexão está aberta
    }

    try {
        // Tabela Categories
        await runAsync(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            );
        `);
        console.log('Tabela "categories" criada ou já existe.');

        // --- Lógica de Migração para novas colunas na tabela 'categories' ---
        let categoryTableInfo = await allAsync("PRAGMA table_info(categories)");
        const categoryColumnNames = categoryTableInfo.map(col => col.name);

        if (!categoryColumnNames.includes('imagem_oculta_start')) {
            console.log('Coluna "imagem_oculta_start" não encontrada na tabela "categories". Adicionando...');
            await runAsync("ALTER TABLE categories ADD COLUMN imagem_oculta_start INTEGER DEFAULT 0");
            console.log('Coluna "imagem_oculta_start" adicionada com sucesso.');
        }
        if (!categoryColumnNames.includes('conexao_start')) {
            console.log('Coluna "conexao_start" não encontrada na tabela "categories". Adicionando...');
            await runAsync("ALTER TABLE categories ADD COLUMN conexao_start INTEGER DEFAULT 0");
            console.log('Coluna "conexao_start" adicionada com sucesso.');
        }
        // NOVA MIGRAÇÃO: bug_start
        if (!categoryColumnNames.includes('bug_start')) {
            console.log('Coluna "bug_start" não encontrada na tabela "categories". Adicionando...');
            await runAsync("ALTER TABLE categories ADD COLUMN bug_start INTEGER DEFAULT 0");
            console.log('Coluna "bug_start" adicionada com sucesso.');
        }
        // --- Fim da Lógica de Migração para 'categories' ---


        // Tabela Imagem Oculta
        await runAsync(`
            CREATE TABLE IF NOT EXISTS imagem_oculta (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hint TEXT NOT NULL,
                answer TEXT NOT NULL,
                imageUrl TEXT NOT NULL,
                order_idx INTEGER DEFAULT NULL
            );
        `);
        console.log('Tabela "imagem_oculta" criada ou já existe.');

        // Lógica de Migração: Verifica e adiciona a coluna order_idx se ela não existir para imagem_oculta
        let imagemOcultaTableInfo = await allAsync("PRAGMA table_info(imagem_oculta)");
        let hasOrderColumnImagemOculta = imagemOcultaTableInfo.some(col => col.name === 'order_idx');

        if (!hasOrderColumnImagemOculta) {
            console.log('Coluna "order_idx" não encontrada na tabela "imagem_oculta". Adicionando...');
            await runAsync("ALTER TABLE imagem_oculta ADD COLUMN order_idx INTEGER DEFAULT NULL");
            console.log('Coluna "order_idx" adicionada com sucesso.');
        }

        // Tabela de relacionamento category_imagem_oculta
        await runAsync(`
            CREATE TABLE IF NOT EXISTS category_imagem_oculta (
                category_id INTEGER NOT NULL,
                imagem_oculta_id INTEGER NOT NULL,
                PRIMARY KEY (category_id, imagem_oculta_id),
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (imagem_oculta_id) REFERENCES imagem_oculta(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabela "category_imagem_oculta" criada ou já existe.');

        // Tabela Scores
        await runAsync(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team TEXT UNIQUE NOT NULL,
                points INTEGER NOT NULL DEFAULT 0
            );
        `);
        console.log('Tabela "scores" criada ou já existe.');

        // Dispositivos e mapeamentos da botoeira (SDL/Pygame)
        await runAsync(`
            CREATE TABLE IF NOT EXISTS hid_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                identifier TEXT UNIQUE,
                driver_type TEXT NOT NULL DEFAULT 'sdl',
                enabled INTEGER NOT NULL DEFAULT 1
            );
        `);
        await runAsync(`
            CREATE TABLE IF NOT EXISTS hid_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER,
                name TEXT NOT NULL,
                input_code TEXT NOT NULL,
                output_key TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (device_id) REFERENCES hid_devices(id) ON DELETE CASCADE,
                UNIQUE (device_id, input_code)
            );
        `);
        console.log('Tabelas "hid_devices" e "hid_mappings" criadas ou já existem.');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS shortcuts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL,
                context TEXT NOT NULL,
                key_value TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                UNIQUE (context, key_value)
            );
        `);
        console.log('Tabela "shortcuts" criada ou já existe.');

        // =========================================================
        //                 NOVAS TABELAS PARA CONEXÃO (COM order_idx)
        // =========================================================

        // Tabela Conexao
        await runAsync(`
            CREATE TABLE IF NOT EXISTS conexao (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                palavra TEXT NOT NULL,
                imageUrl TEXT NOT NULL,
                order_idx INTEGER DEFAULT NULL -- Adicionado order_idx aqui
            );
        `);
        console.log('Tabela "conexao" criada ou já existe.');

        // Lógica de Migração: Verifica e adiciona a coluna order_idx se ela não existir para conexao
        let conexaoTableInfo = await allAsync("PRAGMA table_info(conexao)");
        let hasOrderColumnConexao = conexaoTableInfo.some(col => col.name === 'order_idx');

        if (!hasOrderColumnConexao) {
            console.log('Coluna "order_idx" não encontrada na tabela "conexao". Adicionando...');
            await runAsync("ALTER TABLE conexao ADD COLUMN order_idx INTEGER DEFAULT NULL");
            console.log('Coluna "order_idx" adicionada com sucesso à tabela "conexao".');
        }

        // Tabela de relacionamento category_conexao
        await runAsync(`
            CREATE TABLE IF NOT EXISTS category_conexao (
                category_id INTEGER NOT NULL,
                conexao_id INTEGER NOT NULL,
                PRIMARY KEY (category_id, conexao_id),
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (conexao_id) REFERENCES conexao(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabela "category_conexao" criada ou já existe.');

        // =========================================================
        //            FIM DAS NOVAS TABELAS PARA CONEXÃO
        // =========================================================

        // =========================================================
        //                 NOVAS TABELAS PARA BUG
        // =========================================================

        // Tabela bug_words
        await runAsync(`
            CREATE TABLE IF NOT EXISTS bug_words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL UNIQUE,
                order_idx INTEGER DEFAULT NULL
            );
        `);
        console.log('Tabela "bug_words" criada ou já existe.');

        // Lógica de Migração: Verifica e adiciona a coluna order_idx se ela não existir para bug_words
        let bugWordsTableInfo = await allAsync("PRAGMA table_info(bug_words)");
        let hasOrderColumnBugWords = bugWordsTableInfo.some(col => col.name === 'order_idx');

        if (!hasOrderColumnBugWords) {
            console.log('Coluna "order_idx" não encontrada na tabela "bug_words". Adicionando...');
            await runAsync("ALTER TABLE bug_words ADD COLUMN order_idx INTEGER DEFAULT NULL");
            console.log('Coluna "order_idx" adicionada com sucesso à tabela "bug_words".');
        }

        // Tabela de relacionamento category_bug_words
        await runAsync(`
            CREATE TABLE IF NOT EXISTS category_bug_words (
                category_id INTEGER NOT NULL,
                bug_word_id INTEGER NOT NULL,
                PRIMARY KEY (category_id, bug_word_id),
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (bug_word_id) REFERENCES bug_words(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabela "category_bug_words" criada ou já existe.');

        // Tabela bug_boards
        await runAsync(`
            CREATE TABLE IF NOT EXISTS bug_boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                board_config TEXT NOT NULL,
                selected INTEGER DEFAULT 0 -- NOVA COLUNA AQUI
            );
        `);
        console.log('Tabela "bug_boards" criada ou já existe.');

        // Lógica de Migração: Verifica e adiciona a coluna 'selected' se ela não existir para bug_boards
        let bugBoardsTableInfo = await allAsync("PRAGMA table_info(bug_boards)");
        let hasSelectedColumnBugBoards = bugBoardsTableInfo.some(col => col.name === 'selected');

        if (!hasSelectedColumnBugBoards) {
            console.log('Coluna "selected" não encontrada na tabela "bug_boards". Adicionando...');
            await runAsync("ALTER TABLE bug_boards ADD COLUMN selected INTEGER DEFAULT 0");
            console.log('Coluna "selected" adicionada com sucesso à tabela "bug_boards".');
        }

        // =========================================================
        //            FIM DAS NOVAS TABELAS PARA BUG
        // =========================================================

    } catch (error) {
        console.error('Erro durante a criação ou migração de tabelas:', error);
        throw error; // Rejeita a Promise para que o erro seja propagado
    }
}

/**
 * Popula o banco de dados com os dados iniciais se as tabelas estiverem vazias.
 * A lógica de ALTER TABLE foi movida para createTables para maior robustez.
 */
async function seedInitialData() {
    for (const [code, label, context, keyValue] of INITIAL_SHORTCUTS) {
        await runAsync(
            'INSERT OR IGNORE INTO shortcuts (code, label, context, key_value, enabled) VALUES (?, ?, ?, ?, 1)',
            [code, label, context, keyValue]
        );
    }

    // Categorias iniciais para teste
    const initialCategories = ['Personagens', 'Animais', 'Objetos', 'Comida', 'Geral']; // Adicionei 'Geral'
    const categoryCountRow = await getAsync("SELECT COUNT(*) AS count FROM categories");
    if (categoryCountRow.count === 0) {
        console.log('Populando "categories" com dados iniciais...');
        for (const catName of initialCategories) {
            // New columns will automatically get their DEFAULT 0 value as specified in ALTER TABLE
            await runAsync("INSERT INTO categories (name) VALUES (?)", [catName]);
        }
        console.log('Dados iniciais de categories inseridos com sucesso.');
    } else {
        console.log('Tabela "categories" já contém dados. Ignorando seeding.');
    }

    // Personagens iniciais
    const ALL_CHARACTERS = [
        { name: 'Mickey Mouse', imageUrl: '/characters/mickey.png', hint: 'Um famoso rato falante de desenhos animados.', categoryNames: ['Personagens', 'Animais'], order: 1 },
        { name: 'Homem Aranha', imageUrl: '/characters/homem_aranha.png', hint: 'Um herói que escala paredes e solta teias.', categoryNames: ['Personagens'], order: 2 },
        { name: 'Pikachu', imageUrl: '/characters/pikachu.png', hint: 'Um monstrinho amarelo que libera choques elétricos.', categoryNames: ['Personagens', 'Animais'], order: 3 },
        { name: 'Goku', imageUrl: '/characters/goku.png', hint: 'Um guerreiro alienígena com cabelo espetado que adora lutar.', categoryNames: ['Personagens'], order: 4 },
        { name: 'Homem de Ferro', imageUrl: '/characters/homem_ferro.png', hint: 'Um bilionário que usa uma armadura de alta tecnologia.', categoryNames: ['Personagens', 'Objetos'], order: 5 },
        { name: 'Batman', imageUrl: '/characters/batman.png', hint: 'O Cavaleiro das Trevas que protege Gotham City.', categoryNames: ['Personagens'], order: 6 },
        { name: 'Capitão America', imageUrl: '/characters/capitao_america.png', hint: 'Um super-soldado com um escudo patriótico.', categoryNames: ['Personagens'], order: 7 },
        { name: 'Mulher Maravilha', imageUrl: '/characters/mulher_maravilha.png', hint: 'Uma princesa amazona com um laço mágico.', categoryNames: ['Personagens'], order: 8 },
    ];

    // Seed para imagem_oculta e category_imagem_oculta
    const charCountRow = await getAsync("SELECT COUNT(*) AS count FROM imagem_oculta");
    if (charCountRow && charCountRow.count === 0) { // Verifica se charCountRow é válido
        console.log('Populando "imagem_oculta" com dados iniciais...');
        const existingCategories = await allAsync("SELECT id, name FROM categories");
        const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

        for (const char of ALL_CHARACTERS) {
            const result = await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl, order_idx) VALUES (?, ?, ?, ?)", [char.hint, char.name, char.imageUrl, char.order]);
            const imagemOcultaId = result.lastID;

            for (const catName of char.categoryNames) {
                const categoryId = categoryMap.get(catName);
                if (categoryId) {
                    await runAsync("INSERT INTO category_imagem_oculta (category_id, imagem_oculta_id) VALUES (?, ?)", [categoryId, imagemOcultaId]);
                } else {
                    console.warn(`Categoria '${catName}' não encontrada para o personagem '${char.name}'.`);
                }
            }
        }
        console.log('Dados iniciais de imagem_oculta e associações inseridos com sucesso.');
    } else {
        console.log('Tabela "imagem_oculta" já contém dados. Ignorando seeding.');
    }

    // Seed para scores
    const scoreCountRow = await getAsync("SELECT COUNT(*) AS count FROM scores");
    if (scoreCountRow && scoreCountRow.count === 0) { // Verifica se scoreCountRow é válido
        console.log('Populando "scores" com dados iniciais (0 para cada time)...');
        const initialTeams = ['Azul', 'Vermelho', 'Verde', 'Amarelo'];
        for (const team of initialTeams) {
            await runAsync("INSERT INTO scores (team, points) VALUES (?, ?)", [team, 100]); // Times começam com 100 pontos
        }
        console.log('Scores iniciais inseridos com sucesso.');
    } else {
        console.log('Tabela "scores" já contém dados. Ignorando seeding.');
    }

    // =========================================================
    //              NOVO SEEDING PARA CONEXÃO (COM order_idx)
    // =========================================================

    const ALL_CONEXOES = [
        { palavra: 'Maçã', imageUrl: '/conexao_images/maca.png', categoryNames: ['Comida', 'Objetos'], order: 1 },
        { palavra: 'Cachorro', imageUrl: '/conexao_images/cachorro.png', categoryNames: ['Animais'], order: 2 },
        { palavra: 'Carro', imageUrl: '/conexao_images/carro.png', categoryNames: ['Objetos'], order: 3 },
        { palavra: 'Banana', imageUrl: '/conexao_images/banana.png', categoryNames: ['Comida'], order: 4 },
    ];

    const conexaoCountRow = await getAsync("SELECT COUNT(*) AS count FROM conexao");
    if (conexaoCountRow && conexaoCountRow.count === 0) {
        console.log('Populando "conexao" com dados iniciais...');
        const existingCategories = await allAsync("SELECT id, name FROM categories");
        const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

        for (const con of ALL_CONEXOES) {
            // Adicionado 'order_idx' na query e nos parâmetros
            const result = await runAsync("INSERT INTO conexao (palavra, imageUrl, order_idx) VALUES (?, ?, ?)", [con.palavra, con.imageUrl, con.order]);
            const conexaoId = result.lastID;

            for (const catName of con.categoryNames) {
                const categoryId = categoryMap.get(catName);
                if (categoryId) {
                    await runAsync("INSERT INTO category_conexao (category_id, conexao_id) VALUES (?, ?)", [categoryId, conexaoId]);
                } else {
                    console.warn(`Categoria '${catName}' não encontrada para a conexão '${con.palavra}'.`);
                }
            }
        }
        console.log('Dados iniciais de conexao e associações inseridos com sucesso.');
    } else {
        console.log('Tabela "conexao" já contém dados. Ignorando seeding.');
    }

    // =========================================================
    //            FIM DO NOVO SEEDING PARA CONEXÃO
    // =========================================================

    // =========================================================
    //              NOVO SEEDING PARA BUG
    // =========================================================

    const ALL_BUG_WORDS = [
        { word: 'COMPUTADOR', categoryNames: ['Objetos', 'Geral'], order: 1 },
        { word: 'PROGRAMACAO', categoryNames: ['Geral'], order: 2 },
        { word: 'DESENVOLVEDOR', categoryNames: ['Geral'], order: 3 },
        { word: 'INTELIGENCIA', categoryNames: ['Geral'], order: 4 },
        { word: 'ALGORITMO', categoryNames: ['Geral'], order: 5 },
        { word: 'CRIPTOGRAFIA', categoryNames: ['Geral'], order: 6 },
    ];

    const bugWordCountRow = await getAsync("SELECT COUNT(*) AS count FROM bug_words");
    if (bugWordCountRow && bugWordCountRow.count === 0) {
        console.log('Populando "bug_words" com dados iniciais...');
        const existingCategories = await allAsync("SELECT id, name FROM categories");
        const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

        for (const bugWord of ALL_BUG_WORDS) {
            const result = await runAsync("INSERT INTO bug_words (word, order_idx) VALUES (?, ?)", [bugWord.word, bugWord.order]);
            const bugWordId = result.lastID;

            for (const catName of bugWord.categoryNames) {
                const categoryId = categoryMap.get(catName);
                if (categoryId) {
                    await runAsync("INSERT INTO category_bug_words (category_id, bug_word_id) VALUES (?, ?)", [categoryId, bugWordId]);
                } else {
                    console.warn(`Categoria '${catName}' não encontrada para a palavra BUG '${bugWord.word}'.`);
                }
            }
        }
        console.log('Dados iniciais de bug_words e associações inseridos com sucesso.');
    } else {
        console.log('Tabela "bug_words" já contém dados. Ignorando seeding.');
    }

    const ALL_BUG_BOARDS = [
        {
            name: 'Tabuleiro Padrão',
            board_config: JSON.stringify([
                [10, 20, 'Bug', 30, 20],
                [20, 'Carroção', 10, 20, 20],
                [30, 10, 20, 'Bug', 20],
                ['Carroção', 20, 30, 10, 20]
            ]),
            selected: 1 // Definir o primeiro como selecionado
        },
        {
            name: 'Tabuleiro Fácil',
            board_config: JSON.stringify([
                [10, 10, 'Bug', 10, 10],
                [10, 'Carroção', 10, 10, 10],
                [10, 10, 10, 'Bug', 10],
                ['Carroção', 10, 10, 10, 10]
            ]),
            selected: 0
        },
    ];

    const bugBoardCountRow = await getAsync("SELECT COUNT(*) AS count FROM bug_boards");
    if (bugBoardCountRow && bugBoardCountRow.count === 0) {
        console.log('Populando "bug_boards" com dados iniciais...');
        for (const board of ALL_BUG_BOARDS) {
            await runAsync("INSERT INTO bug_boards (name, board_config, selected) VALUES (?, ?, ?)", [board.name, board.board_config, board.selected]);
        }
        console.log('Dados iniciais de bug_boards inseridos com sucesso.');
    } else {
        console.log('Tabela "bug_boards" já contém dados. Ignorando seeding.');
        // Garante que apenas um esteja selecionado se já houver dados
        const selectedBoards = await allAsync("SELECT id FROM bug_boards WHERE selected = 1");
        if (selectedBoards.length === 0 && bugBoardCountRow.count > 0) {
            // Se nenhum estiver selecionado, seleciona o primeiro
            await runAsync("UPDATE bug_boards SET selected = 1 WHERE id = (SELECT MIN(id) FROM bug_boards)");
            console.log('Nenhum tabuleiro BUG estava selecionado, o primeiro foi definido como selecionado.');
        } else if (selectedBoards.length > 1) {
            // Se mais de um estiver selecionado, deseleciona todos exceto o primeiro encontrado
            const firstSelectedId = selectedBoards[0].id;
            await runAsync("UPDATE bug_boards SET selected = 0 WHERE id != ?", [firstSelectedId]);
            console.log('Mais de um tabuleiro BUG estava selecionado, corrigido para apenas um.');
        }
    }

    // =========================================================
    //            FIM DO NOVO SEEDING PARA BUG
    // =========================================================
}

/**
 * Inicializa o banco de dados: conecta, cria tabelas e popula dados iniciais.
 * @returns {sqlite3.Database} A instância do banco de dados.
 */
async function initializeDatabase() {
    try {
        // Criar a pasta 'db' se não existir
        const dbDir = path.join(__dirname, 'db');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir);
        }

        await connectDb();
        await createTables(); // Garante que as tabelas e colunas estão prontas
        await seedInitialData(); // Popula os dados
        return db;
    } catch (error) {
        console.error('Falha ao inicializar o banco de dados:', error);
        process.exit(1); // Encerra o processo se a inicialização do DB falhar
    }
}

// Exporta as funções e as auxiliares
module.exports = {
    initializeDatabase,
    getDbPath: () => DB_PATH,
    restoreDatabase,
    getDb: () => db,
    runAsync,
    getAsync,
    allAsync
};
