import images from '@/constants/images';

// Normalize many possible image shapes into a simple string (uri) or number (require id)
export const normalizeImageValue = (item: any): string | number | null => {
  if (item === null || item === undefined) return null;
  if (typeof item === 'number') return item; // require(...) id
  if (typeof item === 'string' && item.length) return item;
  if (typeof item === 'object') {
    // direct uri/url
    if (item.uri && typeof item.uri === 'string') return item.uri;
    if (item.url && typeof item.url === 'string') return item.url;

    // nested shapes
    if (item.image) {
      if (typeof item.image === 'string' && item.image.length) return item.image;
      if (item.image?.uri) return item.image.uri;
      if (item.image?.url) return item.image.url;
      if (item.image?.path) return item.image.path;
    }

    if (item.file) {
      if (typeof item.file === 'string' && item.file.length) return item.file;
      if (item.file.url) return item.file.url;
      if (item.file.uri) return item.file.uri;
    }

    if (item.path && typeof item.path === 'string') return item.path;
    if (item.src && typeof item.src === 'string') return item.src;
    if (item.data && typeof item.data === 'string' && item.data.startsWith('data:')) return item.data;
  }

  return null;
};

// Convert normalized value into a React Native Image source (object with uri) or numeric require id
export const toImageSource = (item: any, fallback: any = images.noResult): any => {
  const val = normalizeImageValue(item);
  if (val === null) return fallback;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return { uri: val };
  return fallback;
};

export default {
  normalizeImageValue,
  toImageSource,
};
