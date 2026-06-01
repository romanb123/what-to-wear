import { GEMINI_API_KEY } from '../config';

// Image generation models available in this account (from ListModels):
// gemini-3.1-flash-image  = Nano Banana 2 (newest)
// gemini-3-pro-image      = Nano Banana Pro
// gemini-2.5-flash-image  = Nano Banana (returns text, skip)
const MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
];

async function tryGenerate(model, base64Image, prompt, timeoutMs) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
      signal: controller.signal,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error?.message || `HTTP ${res.status}`);
    }

    const parts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imgPart) {
      const reason = json?.candidates?.[0]?.finishReason || 'unknown';
      throw new Error(`no_image:${reason}`);
    }

    return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateFromReference(base64Image, analysisData = {}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not configured');
  }

  const { name, description, category, color } = analysisData;
  const details = [description, name, category, color ? `color: ${color}` : ''].filter(Boolean).join(', ');

  const prompt =
    `Edit this photo of a clothing item (${details}): ` +
    `remove the background and replace it with solid white. ` +
    `Keep the clothing item exactly as it appears in the photo — same colors, shape, and details. ` +
    `Output a clean e-commerce product photo with white background and studio lighting.`;

  let lastError;
  for (const model of MODELS) {
    try {
      return await tryGenerate(model, base64Image, prompt, 180000); // 3 min timeout
    } catch (e) {
      if (e.name === 'AbortError') {
        lastError = new Error(`תם הזמן (3 דק׳) על ${model}`);
      } else {
        lastError = e;
      }
    }
  }

  throw lastError || new Error('כל מודלי Gemini נכשלו');
}
