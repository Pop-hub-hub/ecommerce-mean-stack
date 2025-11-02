const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 60);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const fileFilter = (req, file, cb) => {
  if (allowed.has(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

module.exports = { upload, uploadDir };