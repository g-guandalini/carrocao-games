const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define onde e como os arquivos serão armazenados
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Caminho para a pasta public/characters a partir do diretório atual (server/utils)
        // __dirname em server/utils/upload.js é `Project Root/server/utils`
        // `..` -> `Project Root/server`
        // `..` -> `Project Root`
        // `public` -> `Project Root/public`
        // `characters` -> `Project Root/public/characters`
        const uploadPath = path.join(__dirname, '..', '..', 'public', 'characters'); 
        
        // Garante que o diretório exista. Se não existir, ele é criado.
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Gera um nome de arquivo único para evitar colisões
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Pega a extensão original do arquivo
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Filtra os tipos de arquivo permitidos (apenas imagens)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Somente arquivos de imagem são permitidos!'), false);
    }
};

// Configura o multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por arquivo
});

module.exports = upload;    