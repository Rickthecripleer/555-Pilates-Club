const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads para contenido si no existe
const uploadDir = process.env.UPLOAD_DIR_CONTENIDO || './uploads/contenido';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nombre único: timestamp + nombre original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
        cb(null, `contenido-${name}-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WEBP)'));
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB por defecto
    },
    fileFilter: fileFilter
});

module.exports = upload;

