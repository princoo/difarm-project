import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { uploadsRoot } from '../util/uploadsPath';

function ensureUploadDir() {
  const uploadDir = path.join(uploadsRoot(), 'vaccinations');
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureUploadDir());
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const vaccinationDocumentUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(
      new Error(
        'Only PDF or image files (JPG, PNG, WEBP) are allowed for vaccine documents.'
      )
    );
  },
}).single('document');
