import OpenAI from 'openai'
import type { ExtractedRecipe } from './types'

export const EXTRACTION_PROMPT = `You are a recipe extraction assistant. Given text scraped from a social media post, video description, or recipe website, extract the recipe information and return ONLY valid JSON.

Return this exact JSON structure (omit fields you cannot find, never invent data):
{
  "title": "string",
  "description": "string (1-3 sentences about the dish)",
  "ingredients": [
    { "amount": "string or null", "unit": "string or null", "item": "string (required)" }
  ],
  "steps": [
    { "text": "string (the instruction)", "timerMins": number or null }
  ],
  "prepTime": number (minutes) or null,
  "cookTime": number (minutes) or null,
  "servings": number or null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "cuisine": "string or null",
  "tags": ["array", "of", "strings"]
}

Rules:
- ingredients and steps are REQUIRED arrays (can be empty [] if truly not found)
- timerMins: only set if there is an explicit cooking time mentioned IN that step
- tags: derive from dish type, main ingredient, cuisine, diet (e.g. ["Italian", "Pasta", "Vegetarian"])
- If the text is not a recipe at all, return: {"title": null, "ingredients": [], "steps": []}
- Return ONLY the JSON object, no markdown fences, no explanation`

export async function extractRecipe(rawText: string): Promise<ExtractedRecipe> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseURL = process.env.EXTRACTION_BASE_URL ?? 'https://api.deepseek.com/v1'
  const model   = process.env.EXTRACTION_MODEL ?? 'deepseek-chat'

  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set')

  const client = new OpenAI({ apiKey, baseURL })

  // Truncate to avoid token limits (keep first 8000 chars — enough for any recipe)
  const truncated = rawText.length > 8000 ? rawText.slice(0, 8000) + '\n[... truncated]' : rawText

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `Extract recipe from this text:\n\n${truncated}` },
    ],
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(content) as ExtractedRecipe
    // Ensure arrays exist
    parsed.ingredients = parsed.ingredients ?? []
    parsed.steps = parsed.steps ?? []
    parsed.tags = parsed.tags ?? []
    return parsed
  } catch {
    throw new Error(`LLM returned invalid JSON: ${content.slice(0, 200)}`)
  }
}
