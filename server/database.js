// server/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // Importar o módulo 'fs' para criar diretório

const DB_PATH = path.join(__dirname, 'db', 'game.db');

let db;

/**
 * Funções auxiliares para operações assíncronas no banco de dados.
 */
function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this); // 'this' contém lastID e changes
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
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
 * Cria as tabelas necessárias no banco de dados.
 */
async function createTables() {
    if (!db) {
        await connectDb(); // Garante que a conexão está aberta
    }

    const createCategoriesTable = `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );
    `;

    const createImagemOcultaTable = `
        CREATE TABLE IF NOT EXISTS imagem_oculta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hint TEXT NOT NULL,
            answer TEXT NOT NULL,
            imageUrl TEXT NOT NULL
        );
    `;

    const createCategoryImagemOcultaTable = `
        CREATE TABLE IF NOT EXISTS category_imagem_oculta (
            category_id INTEGER NOT NULL,
            imagem_oculta_id INTEGER NOT NULL,
            PRIMARY KEY (category_id, imagem_oculta_id),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            FOREIGN KEY (imagem_oculta_id) REFERENCES imagem_oculta(id) ON DELETE CASCADE
        );
    `;

    // NOVA TABELA DE SCORES
    const createScoresTable = `
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team TEXT UNIQUE NOT NULL, -- 'Azul', 'Vermelho', 'Verde', 'Amarelo'
            points INTEGER NOT NULL DEFAULT 0
        );
    `;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(createCategoriesTable, (err) => {
                if (err) return reject(err);
                console.log('Tabela "categories" criada ou já existe.');
            });
            db.run(createImagemOcultaTable, (err) => {
                if (err) return reject(err);
                console.log('Tabela "imagem_oculta" criada ou já existe.');
            });
            db.run(createCategoryImagemOcultaTable, (err) => {
                if (err) return reject(err);
                console.log('Tabela "category_imagem_oculta" criada ou já existe.');
            });
            db.run(createScoresTable, (err) => { // Cria a nova tabela de scores
                if (err) return reject(err);
                console.log('Tabela "scores" criada ou já existe.');
                resolve();
            });
        });
    });
}

/**
 * Popula o banco de dados com os dados iniciais se as tabelas estiverem vazias.
 */
async function seedInitialData() {
    const ALL_CHARACTERS = [
        { id: '1', name: 'Mickey Mouse', imageUrl: '/characters/mickey.png', hint: 'Um famoso rato falante de desenhos animados.' },
        { id: '2', name: 'Homem Aranha', imageUrl: '/characters/homem_aranha.png', hint: 'Um herói que escala paredes e solta teias.' },
        { id: '3', name: 'Pikachu', imageUrl: '/characters/pikachu.png', hint: 'Um monstrinho amarelo que libera choques elétricos.' },
        { id: '4', name: 'Goku', imageUrl: '/characters/goku.png', hint: 'Um guerreiro alienígena com cabelo espetado que adora lutar.' },
        { id: '5', name: 'Homem de Ferro', imageUrl: '/characters/homem_ferro.png', hint: 'Um bilionário que usa uma armadura de alta tecnologia.' },
        { id: '6', name: 'Batman', imageUrl: '/characters/batman.png', hint: 'O Cavaleiro das Trevas que protege Gotham City.' },
        { id: '7', name: 'Capitão America', imageUrl: '/characters/capitao_america.png', hint: 'Um super-soldado com um escudo patriótico.' },
        { id: '8', name: 'Mulher Maravilha', imageUrl: '/characters/mulher_maravilha.png', hint: 'Uma princesa amazona com um laço mágico.' },
    ];

    // Seed para imagem_oculta
    const charCountRow = await getAsync("SELECT COUNT(*) AS count FROM imagem_oculta");
    if (charCountRow.count === 0) {
        console.log('Populando "imagem_oculta" com dados iniciais...');
        for (const char of ALL_CHARACTERS) {
            await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl) VALUES (?, ?, ?)", [char.hint, char.name, char.imageUrl]);
        }
        console.log('Dados iniciais de imagem_oculta inseridos com sucesso.');
    } else {
        console.log('Tabela "imagem_oculta" já contém dados. Ignorando seeding.');
    }

    // Seed para scores
    const scoreCountRow = await getAsync("SELECT COUNT(*) AS count FROM scores");
    if (scoreCountRow.count === 0) {
        console.log('Populando "scores" com dados iniciais (0 para cada time)...');
        const initialTeams = ['Azul', 'Vermelho', 'Verde', 'Amarelo']; // Correspondendo ao enum TeamColor
        for (const team of initialTeams) {
            await runAsync("INSERT INTO scores (team, points) VALUES (?, ?)", [team, 0]);
        }
        console.log('Scores iniciais inseridos com sucesso.');
    } else {
        console.log('Tabela "scores" já contém dados. Ignorando seeding.');
    }
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
        await createTables();
        await seedInitialData();
        return db;
    } catch (error) {
        console.error('Falha ao inicializar o banco de dados:', error);
        throw error;
    }
}

// Exporta as funções e as auxiliares
module.exports = {
    initializeDatabase,
    getDb: () => db, // Para acessar a instância do db após a inicialização
    runAsync, // Exportar para uso em outras partes do backend se necessário
    getAsync,
    allAsync
};