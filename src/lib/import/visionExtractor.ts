import { readFileSync } from 'fs'
import OpenAI from 'openai'
import type { ExtractedRecipe } from './types'
import { EXTRACTION_PROMPT } from './extractor'

function getAnthropicToken(): string {
  const credsPath = process.env.ANTHROPIC_BYPASS_CREDENTIALS
  if (!credsPath) throw new Error('VISION_NOT_CONFIGURED')
  try {
    const creds = JSON.parse(readFileSync(credsPath, 'utf8'))
    const token = creds?.claudeAiOauth?.accessToken
    if (!token) throw new Error('no accessToken in credentials file')
    return token
  } catch (e) {
    throw new Error('VISION_NOT_CONFIGURED')
  }
}

export async function extractRecipeFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<ExtractedRecipe> {
  // --- Anthropic OAuth bypass path ---
  if (process.env.ANTHROPIC_BYPASS_CREDENTIALS) {
    const token = getAnthropicToken()
    const model = process.env.VISION_MODEL ?? 'claude-sonnet-4-6'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: EXTRACTION_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the recipe from this screenshot:' },
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          ],
        }],
      }),
      signal: AbortSignal.timeout(90000),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic vision error ${res.status}: ${err.slice(0, 200)}`)
    }

    const data = await res.json() as { content: Array<{ type: string; text: string }> }
    const content = data.content?.find(b => b.type === 'text')?.text ?? '{}'

    try {
      // Anthropic doesn't have json_object mode — strip any markdown fences
      const cleaned = content.replace(/^```json\s*/m, '').replace(/^```\s*$/m, '').trim()
      const parsed = JSON.parse(cleaned) as ExtractedRecipe
      parsed.ingredients = parsed.ingredients ?? []
      parsed.steps = parsed.steps ?? []
      parsed.tags = parsed.tags ?? []
      return parsed
    } catch {
      return { title: null, ingredients: [], steps: [] } as unknown as ExtractedRecipe
    }
  }

  // --- OpenAI-compatible fallback path ---
  const apiKey = process.env.VISION_API_KEY
  if (!apiKey) throw new Error('VISION_NOT_CONFIGURED')

  const baseURL = process.env.VISION_BASE_URL ?? 'https://api.openai.com/v1'
  const model = process.env.VISION_MODEL ?? 'gpt-4o-mini'

  const client = new OpenAI({ apiKey, baseURL })

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the recipe from this screenshot:' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
      },
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
