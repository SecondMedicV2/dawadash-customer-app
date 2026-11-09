import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { PRESCRIPTION_IMAGE_MAX_BYTES } from './prescriptionPolicy.mjs';

export function removeTemporaryPhoto(uri) {
  if (!uri) return;
  if (uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri);
  } else if (uri.startsWith('file:')) {
    try {
      const cache = Paths.cache.uri.replace(/\/$/, '') + '/';
      if (uri.startsWith(cache)) new File(uri).delete();
    } catch {
      // The platform can also clear files from its app cache.
    }
  }
}

export async function compressPrescriptionPhoto(asset) {
  const attempts = [[1600, 0.8], [1600, 0.6], [1200, 0.65], [960, 0.5]];
  const longestSide = Math.max(asset.width, asset.height);
  for (const [maxSide, compress] of attempts) {
    const context = ImageManipulator.manipulate(asset.uri);
    try {
      if (longestSide > maxSide) {
        context.resize(asset.width >= asset.height ? { width: maxSide } : { height: maxSide });
      }
      const image = await context.renderAsync();
      try {
        const result = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
        const bytes = result.base64
          ? result.base64.length * 3 / 4 - (result.base64.match(/=+$/)?.[0].length ?? 0)
          : Infinity;
        if (bytes <= PRESCRIPTION_IMAGE_MAX_BYTES) return { uri: result.uri, mimeType: 'image/jpeg' };
        removeTemporaryPhoto(result.uri);
      } finally {
        image.release();
      }
    } finally {
      context.release();
    }
  }
  return null;
}
