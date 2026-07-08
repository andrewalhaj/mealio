'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

interface ImportedData {
  importId: string
  platform: string
  sourceUrl: string
  sourceAttr: string
  extracted: {
    title?: string
    description?: string
    ingredients?: Array<{ amount?: string; unit?: string; item: string }>
    steps?: Array<{ text: string; timerMins?: number }>
    prepTime?: number
    cookTime?: number
    servings?: number
    difficulty?: string
    cuisine?: string
    tags?: string[]
    heroImage?: string
    sourceAttr?: string
    notes?: string
  }
}

export default function ImportReviewPage() {
  const router = useRouter()
  const [data, setData] = useState<ImportedData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [ingredients, setIngredients] = useState<Array<{ amount?: string; unit?: string; item: string }>>([])
  const [steps, setSteps] = useState<Array<{ text: string }>>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('mealio-import')
    if (!raw) { router.push('/import'); return }
    const d = JSON.parse(raw) as ImportedData
    setData(d)
    const ex = d.extracted
    setTitle(ex.title ?? '')
    setDescription(ex.description ?? '')
    setPrepTime(String(ex.prepTime ?? ''))
    setCookTime(String(ex.cookTime ?? ''))
    setServings(String(ex.servings ?? ''))
    setCuisine(ex.cuisine ?? '')
    setIngredients(ex.ingredients?.length ? ex.ingredients : [{ item: '' }])
    setSteps(ex.steps?.length ? ex.steps : [{ text: '' }])
    setTags(ex.tags ?? [])
  }, [router])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    setError('')

    const payload = {
      title: title || 'Untitled Import',
      description: description || undefined,
      heroImage: data.extracted.heroImage || undefined,
      sourceUrl: data.sourceUrl,
      sourceAttr: data.sourceAttr || data.extracted.sourceAttr,
      notes: data.extracted.notes || undefined,
      prepTime: prepTime ? Number(prepTime) : undefined,
      cookTime: cookTime ? Number(cookTime) : undefined,
      servings: servings ? Number(servings) : undefined,
      cuisine: cuisine || undefined,
      ingredients: ingredients
        .filter(i => i.item.trim())
        .map((i, idx) => ({ ...i, order: idx + 1 })),
      steps: steps
        .filter(s => s.text.trim())
        .map((s, idx) => ({ ...s, order: idx + 1 })),
      tags,
    }

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const saved = await res.json() as { id?: string; error?: string }
      if (!res.ok) throw new Error(saved.error ?? 'Save failed')
      sessionStorage.removeItem('mealio-import')
      router.push(`/recipes/${saved.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="px-6 pt-8">
        <GlassCard className="p-8 text-center text-white/60">Loading import data…</GlassCard>
      </div>
    )
  }

  return (
    <div className="px-6 pb-16 pt-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Review Import</h1>
          <p className="mt-1 text-sm text-white/50 flex items-center gap-1">
            <GlassBadge variant="saffron">{data.platform}</GlassBadge>
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-brand-saffron hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Source
            </a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <GlassButton variant="ghost" onClick={() => router.push('/import')}>← Back</GlassButton>
          <GlassButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Recipe'}
          </GlassButton>
        </div>
      </div>

      {error && (
        <GlassCard className="mb-6 border-brand-tomato/50 bg-brand-tomato/10 px-4 py-3 text-sm text-brand-tomato">
          {error}
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: editable extracted recipe */}
        <div className="space-y-5">
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">Recipe Details</h2>
            <GlassInput label="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-white/60 block mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-glass-sm border border-glass-border bg-glass-white px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none resize-none focus:border-glass-border-strong"
                style={{ backdropFilter: 'blur(16px)' }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <GlassInput label="Prep (min)" type="number" min="0" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
              <GlassInput label="Cook (min)" type="number" min="0" value={cookTime} onChange={e => setCookTime(e.target.value)} />
              <GlassInput label="Servings" type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} />
            </div>
            <GlassInput label="Cuisine" value={cuisine} onChange={e => setCuisine(e.target.value)} />
          </GlassCard>

          {/* Tags */}
          <GlassCard className="p-5">
            <h3 className="font-display font-bold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 rounded-full border border-glass-border bg-glass-white px-3 py-0.5 text-xs text-white">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="text-white/40 hover:text-white">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <GlassInput value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput('') } }}
                placeholder="Add tag…" className="flex-1" />
              <GlassButton type="button" onClick={() => { if (tagInput.trim() && !tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput('') }}>Add</GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* Right: ingredients + steps */}
        <div className="space-y-5">
          <GlassCard className="p-6">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Ingredients
              {ingredients.filter(i => !i.item.trim()).length > 0 && (
                <span className="ml-2 text-xs text-brand-tomato font-sans font-normal">⚠ some may be missing</span>
              )}
            </h2>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={ing.amount ?? ''} onChange={e => { const a = [...ingredients]; a[i] = { ...a[i], amount: e.target.value }; setIngredients(a) }}
                    placeholder="Amt" className="w-14 rounded-glass-sm border border-glass-border bg-glass-white px-2 py-1.5 text-xs text-white outline-none focus:border-glass-border-strong" style={{ backdropFilter: 'blur(16px)' }} />
                  <input value={ing.unit ?? ''} onChange={e => { const a = [...ingredients]; a[i] = { ...a[i], unit: e.target.value }; setIngredients(a) }}
                    placeholder="Unit" className="w-16 rounded-glass-sm border border-glass-border bg-glass-white px-2 py-1.5 text-xs text-white outline-none focus:border-glass-border-strong" style={{ backdropFilter: 'blur(16px)' }} />
                  <input value={ing.item} onChange={e => { const a = [...ingredients]; a[i] = { ...a[i], item: e.target.value }; setIngredients(a) }}
                    placeholder="Ingredient" className={`flex-1 rounded-glass-sm border px-2 py-1.5 text-xs text-white outline-none focus:border-glass-border-strong ${!ing.item.trim() ? 'border-brand-tomato/50 bg-brand-tomato/10' : 'border-glass-border bg-glass-white'}`}
                    style={{ backdropFilter: 'blur(16px)' }} />
                  <GlassButton type="button" variant="ghost" size="sm" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3" />
                  </GlassButton>
                </div>
              ))}
            </div>
            <GlassButton type="button" variant="ghost" size="sm" className="mt-2"
              onClick={() => setIngredients([...ingredients, { item: '' }])}>
              <Plus className="h-3 w-3" /> Add ingredient
            </GlassButton>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Steps
              {steps.filter(s => !s.text.trim()).length > 0 && (
                <span className="ml-2 text-xs text-brand-tomato font-sans font-normal">⚠ some may be missing</span>
              )}
            </h2>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-mono text-brand-saffron text-sm font-bold w-5 pt-1.5 shrink-0">{i + 1}</span>
                  <textarea value={step.text} rows={2}
                    onChange={e => { const a = [...steps]; a[i] = { ...a[i], text: e.target.value }; setSteps(a) }}
                    className={`flex-1 rounded-glass-sm border px-3 py-2 text-sm text-white outline-none resize-none focus:border-glass-border-strong ${!step.text.trim() ? 'border-brand-tomato/50 bg-brand-tomato/10' : 'border-glass-border bg-glass-white'}`}
                    style={{ backdropFilter: 'blur(16px)' }} />
                  <GlassButton type="button" variant="ghost" size="sm" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3" />
                  </GlassButton>
                </div>
              ))}
            </div>
            <GlassButton type="button" variant="ghost" size="sm" className="mt-2"
              onClick={() => setSteps([...steps, { text: '' }])}>
              <Plus className="h-3 w-3" /> Add step
            </GlassButton>
          </GlassCard>
        </div>
      </div>

      {/* Bottom save */}
      <div className="mt-8 flex justify-end gap-3">
        <GlassButton variant="ghost" onClick={() => router.push('/import')}>Cancel</GlassButton>
        <GlassButton variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Recipe'}
        </GlassButton>
      </div>
    </div>
  )
}
