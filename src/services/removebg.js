import { REMOVEBG_API_KEY } from '../config';

const API_URL = 'https://api.remove.bg/v1.0/removebg';

export async function removeBackground(base64Image) {
  if (!REMOVEBG_API_KEY || REMOVEBG_API_KEY === 'YOUR_REMOVEBG_KEY_HERE') {
    return null; // silently skip if no key configured
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'X-Api-Key': REMOVEBG_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_file_b64: base64Image,
      size: 'preview',     // free tier
      bg_color: 'ffffff',  // white background
      format: 'jpg',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Remove.bg error:', err?.errors?.[0]?.title || res.status);
    return null; // fail silently — original image will be used
  }

  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/jpeg;base64,...
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
