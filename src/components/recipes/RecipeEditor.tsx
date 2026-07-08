'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'

interface RecipeEditorProps {
  initialData?: {
    title?: string
    description?: string
    heroImage?: string
    prepTime?: number
    cookTime?: number
    servings?: number
    difficulty?: string
    cuisine?: string
    sourceUrl?: string
    sourceAttr?: string
    notes?: string
    rating?: number
    isFavorite?: boolean
    ingredients?: { amount?: string; unit?: string; item: string; order: number }[]
    steps?: { text: string; order: number; timerMins?: number }[]
    tags?: string[]
  }
  recipeId?: string
}

const EMPTY_INGREDIENT = { amount: '', unit: '', item: '', order: 0 }
const EMPTY_STEP = { text: '', order: 0 }

export function RecipeEditor({ initialData, recipeId }: RecipeEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [title, setTitle]             = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [prepTime, setPrepTime]       = useState(String(initialData?.prepTime ?? ''))
  const [cookTime, setCookTime]       = useState(String(initialData?.cookTime ?? ''))
  const [servings, setServings]       = useState(String(initialData?.servings ?? ''))
  const [difficulty, setDifficulty]   = useState(initialData?.difficulty ?? '')
  const [cuisine, setCuisine]         = useState(initialData?.cuisine ?? '')
  const [rating, setRating]           = useState(initialData?.rating ?? 0)
  const [notes, setNotes]             = useState(initialData?.notes ?? '')
  const [tagInput, setTagInput]       = useState('')
  const [tags, setTags]               = useState<string[]>(initialData?.tags ?? [])

  const [ingredients, setIngredients] = useState<{ amount?: string; unit?: string; item: string; order: number }[]>(
    initialData?.ingredients?.length
      ? initialData.ingredients
      : [{ ...EMPTY_INGREDIENT, order: 1 }]
  )
  const [steps, setSteps] = useState<{ text: string; order: number; timerMins?: number }[]>(
    initialData?.steps?.length
      ? initialData.steps
      : [{ ...EMPTY_STEP, order: 1 }]
  )

  // ── Ingredient helpers ────────────────────────────────────
  const addIngredient = () =>
    setIngredients(prev => [...prev, { ...EMPTY_INGREDIENT, order: prev.length + 1 }])

  const removeIngredient = (i: number) =>
    setIngredients(prev => prev.filter((_, idx) => idx !== i).map((ing, idx) => ({ ...ing, order: idx + 1 })))

  const updateIngredient = (i: number, field: string, val: string) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing))

  const moveIngredient = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= ingredients.length) return
    setIngredients(prev => {
      const arr = [...prev]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr.map((ing, idx) => ({ ...ing, order: idx + 1 }))
    })
  }

  // ── Step helpers ──────────────────────────────────────────
  const addStep = () =>
    setSteps(prev => [...prev, { ...EMPTY_STEP, order: prev.length + 1 }])

  const removeStep = (i: number) =>
    setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })))

  const updateStep = (i: number, field: string, val: string | number) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const moveStep = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= steps.length) return
    setSteps(prev => {
      const arr = [...prev]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
  }

  // ── Tags ─────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const payload = {
      title,
      description: description || undefined,
      prepTime: prepTime ? Number(prepTime) : undefined,
      cookTime: cookTime ? Number(cookTime) : undefined,
      servings: servings ? Number(servings) : undefined,
      difficulty: (difficulty || undefined) as 'easy' | 'medium' | 'hard' | undefined,
      cuisine: cuisine || undefined,
      notes: notes || undefined,
      rating: rating || undefined,
      ingredients: ingredients.filter(i => i.item.trim()),
      steps: steps.filter(s => s.text.trim()),
      tags,
    }

    try {
      const url = recipeId ? `/api/recipes/${recipeId}` : '/api/recipes'
      const method = recipeId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      router.push(`/recipes/${data.id ?? recipeId}`)
      router.refresh()
    } catch (err) {
      setErrors({ form: String(err) })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-16 pt-8 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-white mb-8">
        {recipeId ? 'Edit Recipe' : 'New Recipe'}
      </h1>

      {errors.form && (
        <GlassCard className="mb-6 border-brand-tomato/50 bg-brand-tomato/10 px-4 py-3 text-sm text-brand-tomato">
          {errors.form}
        </GlassCard>
      )}

      {/* Basic info */}
      <GlassCard className="p-6 mb-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-white">Basic Info</h2>
        <GlassInput label="Title *" value={title} onChange={e => setTitle(e.target.value)} required />
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-white/60 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-glass-sm border border-glass-border bg-glass-white px-4 py-2.5 text-sm
                       text-white placeholder-white/40 outline-none resize-none
                       focus:border-glass-border-strong focus:bg-glass-white-md transition-all"
            style={{ backdropFilter: 'blur(16px)' }}
            placeholder="A short description of the dish…"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassInput label="Prep (min)" type="number" min="0" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
          <GlassInput label="Cook (min)" type="number" min="0" value={cookTime} onChange={e => setCookTime(e.target.value)} />
          <GlassInput label="Servings" type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} />
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-white/60 block mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full rounded-glass-sm border border-glass-border bg-brand-olive px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">—</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <GlassInput label="Cuisine" value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="Italian, Thai…" />
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-white/60 block mb-1">Rating</label>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(r => r === n ? 0 : n)}
                  className={`text-2xl transition-colors ${rating >= n ? 'text-brand-saffron' : 'text-white/20'}`}>
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tags */}
      <GlassCard className="p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-white mb-3">Tags</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 rounded-full border border-glass-border bg-glass-white px-3 py-1 text-xs text-white"
              style={{ backdropFilter: 'blur(16px)' }}>
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-white/50 hover:text-white ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <GlassInput
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add tag…"
            className="flex-1"
          />
          <GlassButton type="button" onClick={addTag} variant="default" size="md">Add</GlassButton>
        </div>
      </GlassCard>

      {/* Ingredients */}
      <GlassCard className="p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-white mb-4">Ingredients</h2>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveIngredient(i, 'up')} disabled={i === 0}
                  className="text-white/30 hover:text-white disabled:opacity-0 h-3 flex items-center">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <GripVertical className="h-4 w-4 text-white/20" />
                <button type="button" onClick={() => moveIngredient(i, 'down')} disabled={i === ingredients.length - 1}
                  className="text-white/30 hover:text-white disabled:opacity-0 h-3 flex items-center">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <input value={ing.amount ?? ''} onChange={e => updateIngredient(i, 'amount', e.target.value)}
                placeholder="Amt" className="w-16 rounded-glass-sm border border-glass-border bg-glass-white px-2 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-glass-border-strong" style={{ backdropFilter: 'blur(16px)' }} />
              <input value={ing.unit ?? ''} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                placeholder="Unit" className="w-20 rounded-glass-sm border border-glass-border bg-glass-white px-2 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-glass-border-strong" style={{ backdropFilter: 'blur(16px)' }} />
              <input value={ing.item} onChange={e => updateIngredient(i, 'item', e.target.value)}
                placeholder="Ingredient *" required className="flex-1 rounded-glass-sm border border-glass-border bg-glass-white px-2 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-glass-border-strong" style={{ backdropFilter: 'blur(16px)' }} />
              <GlassButton type="button" variant="ghost" size="sm" onClick={() => removeIngredient(i)} disabled={ingredients.length <= 1}>
                <Trash2 className="h-3.5 w-3.5" />
              </GlassButton>
            </div>
          ))}
        </div>
        <GlassButton type="button" variant="ghost" size="sm" className="mt-3" onClick={addIngredient}>
          <Plus className="h-4 w-4" /> Add ingredient
        </GlassButton>
      </GlassCard>

      {/* Steps */}
      <GlassCard className="p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-white mb-4">Instructions</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex flex-col items-center gap-0.5 pt-2">
                <button type="button" onClick={() => moveStep(i, 'up')} disabled={i === 0}
                  className="text-white/30 hover:text-white disabled:opacity-0"><ChevronUp className="h-3 w-3" /></button>
                <span className="font-mono text-brand-saffron text-sm font-bold w-6 text-center">{i + 1}</span>
                <button type="button" onClick={() => moveStep(i, 'down')} disabled={i === steps.length - 1}
                  className="text-white/30 hover:text-white disabled:opacity-0"><ChevronDown className="h-3 w-3" /></button>
              </div>
              <textarea
                value={step.text}
                onChange={e => updateStep(i, 'text', e.target.value)}
                rows={2}
                required
                placeholder={`Step ${i + 1}…`}
                className="flex-1 rounded-glass-sm border border-glass-border bg-glass-white px-3 py-2 text-sm text-white placeholder-white/30 outline-none resize-none focus:border-glass-border-strong focus:bg-glass-white-md transition-all"
                style={{ backdropFilter: 'blur(16px)' }}
              />
              <GlassButton type="button" variant="ghost" size="sm" onClick={() => removeStep(i)} disabled={steps.length <= 1} className="mt-1">
                <Trash2 className="h-3.5 w-3.5" />
              </GlassButton>
            </div>
          ))}
        </div>
        <GlassButton type="button" variant="ghost" size="sm" className="mt-3" onClick={addStep}>
          <Plus className="h-4 w-4" /> Add step
        </GlassButton>
      </GlassCard>

      {/* Notes */}
      <GlassCard className="p-6 mb-8">
        <h2 className="font-display text-lg font-bold text-white mb-3">Personal Notes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-glass-sm border border-glass-border bg-glass-white px-4 py-2.5 text-sm
                     text-white placeholder-white/40 outline-none resize-none focus:border-glass-border-strong"
          style={{ backdropFilter: 'blur(16px)' }}
          placeholder="Tips, variations, substitutions…"
        />
      </GlassCard>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <GlassButton type="button" variant="ghost" onClick={() => router.back()}>Cancel</GlassButton>
        <GlassButton type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Saving…' : recipeId ? 'Save Changes' : 'Create Recipe'}
        </GlassButton>
      </div>
    </form>
  )
}
