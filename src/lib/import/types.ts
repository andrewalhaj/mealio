export interface ExtractedRecipe {
  title?: string
  description?: string
  ingredients?: Array<{ amount?: string; unit?: string; item: string }>
  steps?: Array<{ text: string; timerMins?: number }>
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  cuisine?: string
  tags?: string[]
  heroImage?: string
  sourceAttr?: string
  notes?: string
}

export interface FetchResult {
  platform: string
  rawText: string
  thumbnailUrl?: string
  sourceAttr?: string
  /** Plain channel/creator name, e.g. "Natashas Kitchen". Used for creator-aware web search. */
  creator?: string
}

export interface ImportProgress {
  step: 'fetching' | 'reading' | 'structuring' | 'ready' | 'error'
  message?: string
}
