import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import { ADOBE_STOCK_CATEGORIES, MAX_TITLE_LENGTH, MAX_KEYWORDS, MIN_KEYWORDS } from '$lib/constants.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      throw error(400, 'No image provided');
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const categoriesList = ADOBE_STOCK_CATEGORIES.join(', ');

    const prompt = `You are an expert Adobe Stock metadata specialist. Analyze this image and generate optimized metadata following Adobe Stock guidelines strictly.

RULES:
1. TITLE: 
   - Max ${MAX_TITLE_LENGTH} characters, natural descriptive language
   - Answer: Who (gender, age, ethnicity, role), What (action), Where (location/setting), When (time of day if relevant), Mood, Concept
   - NO brand names, NO people's real names, NO camera specs

2. KEYWORDS:
   - Generate ${MIN_KEYWORDS} to 40 keywords
   - IMPORTANT: Almost ALL keywords must be SINGLE words (e.g., beach, woman, sunset, running)
   - EXCEPTION: Only use multi-word for proper nouns or compound nouns that cannot be separated (e.g., "golden retriever", "Eiffel Tower", "Great Barrier Reef")
   - Do NOT use phrases like "one person", "senior woman", "red dress" — instead use: solo, senior, woman, red, dress
   - Order by importance (most relevant first — these become top 10 which have biggest search impact)
   - Cover: main subject, action, setting, mood/emotion, concept, demographics, camera perspective
   - NO brand names, NO synonyms of same word, NO spam

3. CATEGORY: Choose ONE from this list: ${categoriesList}

Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "keywords": ["word1", "word2", ...],
  "category": "string"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw error(500, 'Invalid response from AI');
    }

    const metadata = JSON.parse(jsonMatch[0]);

    // Validate and sanitize
    if (!metadata.title || !Array.isArray(metadata.keywords) || !metadata.category) {
      throw error(500, 'Incomplete metadata from AI');
    }

    // Enforce max keywords
    metadata.keywords = metadata.keywords.slice(0, MAX_KEYWORDS);

    // Ensure category is valid
    if (!ADOBE_STOCK_CATEGORIES.includes(metadata.category)) {
      metadata.category = ADOBE_STOCK_CATEGORIES[0];
    }

    return json(metadata);

  } catch (err) {
    console.error('Gemini API error:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to generate metadata');
  }
}
