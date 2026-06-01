import { GROQ_API_KEY } from '../config';
import { PRESET_COLORS } from '../theme';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL   = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ── Color matching ──────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function closestPreset(hex) {
  const c = hexToRgb(hex);
  if (!c) return PRESET_COLORS[0];
  let best = PRESET_COLORS[0], bestDist = Infinity;
  for (const p of PRESET_COLORS) {
    const pc = hexToRgb(p);
    if (!pc) continue;
    const d = Math.sqrt((c.r-pc.r)**2 + (c.g-pc.g)**2 + (c.b-pc.b)**2);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

// ── Main function ───────────────────────────────────────────────────────────

export async function analyzeClothing(base64Image) {
  const prompt = `You are a fashion expert analyzing a clothing item photo.
Return ONLY a valid JSON object (no markdown, no extra text) with these exact fields:

{
  "name": "short descriptive product name (e.g. 'Classic White Button-Down Shirt')",
  "category": "exactly one of: Shirts, Pants, Dresses, Shoes, Jackets, Accessories",
  "color": "dominant color as hex code (e.g. #2C3E50)",
  "brand": "brand name if a logo or tag is clearly visible, otherwise null",
  "season": "exactly one of: Summer, Winter, Spring/Fall, All Year",
  "style": "exactly one of: Casual, Formal, Sport, Evening",
  "description": "detailed description for product image generation — include: garment type, dominant color, secondary colors, pattern or print (solid/striped/floral/graphic/etc), fabric texture if visible (cotton/denim/leather/knit/etc), fit (slim/regular/oversized/tailored), length (crop/regular/long/maxi), neckline (crew/v-neck/collar/turtleneck/etc), sleeve length (sleeveless/short/long/3-quarter), notable design features (buttons/pockets/hood/zipper/lace/embroidery/etc), overall style vibe. Be specific and detailed."
}

Always return valid JSON only.`;

  const body = {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
      ],
    }],
    temperature: 0.2,
    max_tokens: 500,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out after 30s. Try again.');
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';

  if (!text) {
    throw new Error('No clothing item detected. Please photograph a clothing item directly.');
  }

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

  // Try to extract JSON object if there's surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not find JSON in response: ${cleaned.slice(0, 100)}`);
  }

  const data = JSON.parse(jsonMatch[0]);

  // Map the returned hex to the closest preset swatch
  if (data.color) data.color = closestPreset(data.color);

  return data;
}
