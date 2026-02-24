import multer from 'multer';
import { AppError } from '../../application/errors/app-error.js';

const storage = multer.memoryStorage();

const photoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

export { photoUpload };
