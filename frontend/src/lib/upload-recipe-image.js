import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorageInstance } from './firebase';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_RECIPE_IMAGE_FOLDER = 'recipes';

function sanitizeFileName(fileName = 'image') {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function convertImageFileToWebp(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const loadedImage = new Image();

      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () =>
        reject(new Error('Failed to read the image.'));
      loadedImage.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image conversion is not supported in this browser.');
    }

    context.drawImage(image, 0, 0);

    const webpBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert the image to WebP.'));
            return;
          }

          resolve(blob);
        },
        'image/webp',
        0.85,
      );
    });

    return webpBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function buildImagePath(file, { baseFolder } = {}) {
  const safeName = sanitizeFileName(file?.name || 'image');
  const uniqueSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const rootFolder =
    baseFolder ||
    import.meta.env.VITE_FIREBASE_RECIPE_IMAGE_FOLDER ||
    DEFAULT_RECIPE_IMAGE_FOLDER;

  const baseName = safeName.replace(/\.[^.]+$/, '') || 'image';
  return `${rootFolder}/${baseName}_${uniqueSuffix}.webp`;
}

export async function uploadRecipeImage(file, options = {}) {
  if (!file) {
    throw new Error('Please choose an image file before uploading.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }

  const storage = getFirebaseStorageInstance();
  const path = buildImagePath(file, options);
  const imageRef = ref(storage, path);
  const webpBlob = await convertImageFileToWebp(file);

  await uploadBytes(imageRef, webpBlob, {
    contentType: 'image/webp',
    cacheControl: 'public,max-age=3600',
  });

  return getDownloadURL(imageRef);
}
