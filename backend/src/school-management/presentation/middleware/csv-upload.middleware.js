import multer from 'multer';
import { AppError } from '../../application/errors/app-error.js';

const storage = multer.memoryStorage();

const csvUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only CSV files are allowed'));
    }
  },
});

export { csvUpload };
