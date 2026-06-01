import { GEMINI_API_KEY } from '../config';

// Gemini 2.0 Flash Experimental Image Generation — supports img2img editing
// This model accepts an image as input and can output an edited image.
const MODEL    = 'gemini-2.0-flash-exp-image-generation';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function generateFromReference(base64Image, analysisData = {}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not configured');
  }

  const { name, description, category } = analysisData;
  const subject = description || name || category || 'clothing item';

  // Clear instruction to edit the image (not describe it)
  const prompt =
    `Edit this photo: remove the background and replace it with solid white. ` +
    `Keep the ${subject} exactly as it appears. ` +
    `Output a clean e-commerce product photo with white background and soft studio lighting.`;

  const controller = new AbortController();
  // 3-minute timeout — image generation can be slow
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const res = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          // Request IMAGE output only — prevents the model from replying with text instead
          responseModalities: ['IMAGE'],
        },
      }),
      signal: controller.signal,
    });

    const json = await res.json();

    if (!res.ok) {
      // Surface the exact Gemini error (quota, model not found, etc.)
      throw new Error(json?.error?.message || `Gemini error ${res.status}`);
    }

    const parts = json?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart) {
      const textPart    = parts.find(p => p.text)?.text || '';
      const finishReason = json?.candidates?.[0]?.finishReason || 'unknown';
      throw new Error(
        `Gemini did not return an image.\nReason: ${finishReason}` +
        (textPart ? `\nModel said: "${textPart.slice(0, 120)}"` : '')
      );
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('Image generation timed out (3 min). Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
