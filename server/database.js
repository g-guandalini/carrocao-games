// server/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

    // A FOREIGN KEY CASCADE DELETE é importante aqui para o CRUD
    const createCategoryImagemOcultaTable = `
        CREATE TABLE IF NOT EXISTS category_imagem_oculta (
            category_id INTEGER NOT NULL,
            imagem_oculta_id INTEGER NOT NULL,
            PRIMARY KEY (category_id, imagem_oculta_id),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            FOREIGN KEY (imagem_oculta_id) REFERENCES imagem_oculta(id) ON DELETE CASCADE
        );
    `;

    const createScoresTable = `
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team TEXT UNIQUE NOT NULL,
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
            db.run(createCategoryImagemOcultaTable, (err) => { // Cria a tabela de relacionamento
                if (err) return reject(err);
                console.log('Tabela "category_imagem_oculta" criada ou já existe.');
            });
            db.run(createScoresTable, (err) => {
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
    // Categorias iniciais para teste
    const initialCategories = ['Personagens', 'Animais', 'Objetos', 'Comida'];
    const categoryCountRow = await getAsync("SELECT COUNT(*) AS count FROM categories");
    if (categoryCountRow.count === 0) {
        console.log('Populando "categories" com dados iniciais...');
        for (const catName of initialCategories) {
            await runAsync("INSERT INTO categories (name) VALUES (?)", [catName]);
        }
        console.log('Dados iniciais de categories inseridos com sucesso.');
    } else {
        console.log('Tabela "categories" já contém dados. Ignorando seeding.');
    }

    // Personagens iniciais
    const ALL_CHARACTERS = [
        { name: 'Mickey Mouse', imageUrl: '/characters/mickey.png', hint: 'Um famoso rato falante de desenhos animados.', categoryNames: ['Personagens', 'Animais'] },
        { name: 'Homem Aranha', imageUrl: '/characters/homem_aranha.png', hint: 'Um herói que escala paredes e solta teias.', categoryNames: ['Personagens'] },
        { name: 'Pikachu', imageUrl: '/characters/pikachu.png', hint: 'Um monstrinho amarelo que libera choques elétricos.', categoryNames: ['Personagens', 'Animais'] },
        { name: 'Goku', imageUrl: '/characters/goku.png', hint: 'Um guerreiro alienígena com cabelo espetado que adora lutar.', categoryNames: ['Personagens'] },
        { name: 'Homem de Ferro', imageUrl: '/characters/homem_ferro.png', hint: 'Um bilionário que usa uma armadura de alta tecnologia.', categoryNames: ['Personagens', 'Objetos'] },
        { name: 'Batman', imageUrl: '/characters/batman.png', hint: 'O Cavaleiro das Trevas que protege Gotham City.', categoryNames: ['Personagens'] },
        { name: 'Capitão America', imageUrl: '/characters/capitao_america.png', hint: 'Um super-soldado com um escudo patriótico.', categoryNames: ['Personagens'] },
        { name: 'Mulher Maravilha', imageUrl: '/characters/mulher_maravilha.png', hint: 'Uma princesa amazona com um laço mágico.', categoryNames: ['Personagens'] },
    ];

    // Seed para imagem_oculta e category_imagem_oculta
    const charCountRow = await getAsync("SELECT COUNT(*) AS count FROM imagem_oculta");
    if (charCountRow.count === 0) {
        console.log('Populando "imagem_oculta" com dados iniciais...');
        const existingCategories = await allAsync("SELECT id, name FROM categories");
        const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

        for (const char of ALL_CHARACTERS) {
            const result = await runAsync("INSERT INTO imagem_oculta (hint, answer, imageUrl) VALUES (?, ?, ?)", [char.hint, char.name, char.imageUrl]);
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
    if (scoreCountRow.count === 0) {
        console.log('Populando "scores" com dados iniciais (0 para cada time)...');
        const initialTeams = ['Azul', 'Vermelho', 'Verde', 'Amarelo'];
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
    getDb: () => db,
    runAsync,
    getAsync,
    allAsync
};