'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ChefHat } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassModal } from '@/components/ui/GlassModal'

interface RecipeInCollection {
  id: string
  title: string
  dominantColor: string | null
  totalTime: number | null
}

interface Collection {
  id: string
  name: string
  recipes: { recipe: RecipeInCollection }[]
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchCollections = async () => {
    setLoading(true)
    const res = await fetch('/api/collections')
    setCollections(await res.json() as Collection[])
    setLoading(false)
  }

  useEffect(() => { fetchCollections() }, [])

  const createCollection = async () => {
    if (!newName.trim()) return
    setCreating(true)
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setModalOpen(false)
    setCreating(false)
    await fetchCollections()
  }

  const deleteCollection = async (id: string) => {
    await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    await fetchCollections()
  }

  return (
    <div className="px-6 pb-16 pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Collections</h1>
          <p className="mt-2 text-white/60">Organize your recipes into curated sets.</p>
        </div>
        <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> New Collection
        </GlassButton>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <GlassCard key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-4 py-16 text-center">
          <ChefHat className="h-12 w-12 text-white/20" />
          <p className="text-white/60">No collections yet.</p>
          <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
            Create your first collection
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <GlassCard key={col.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-bold text-white">{col.name}</h2>
                <GlassButton variant="ghost" size="sm"
                  onClick={() => { if (confirm(`Delete "${col.name}"?`)) deleteCollection(col.id) }}
                  aria-label="Delete collection">
                  <Trash2 className="h-3.5 w-3.5" />
                </GlassButton>
              </div>
              <p className="text-xs text-white/50">{col.recipes.length} recipe{col.recipes.length !== 1 ? 's' : ''}</p>
              {/* Recipe previews */}
              {col.recipes.length > 0 ? (
                <div className="space-y-1.5 flex-1">
                  {col.recipes.slice(0, 4).map(({ recipe: r }) => (
                    <Link key={r.id} href={`/recipes/${r.id}`}>
                      <div className="flex items-center gap-2 rounded-glass-sm px-2 py-1.5 hover:bg-glass-white transition-colors">
                        <div className="h-4 w-4 rounded-sm shrink-0"
                          style={{ background: r.dominantColor ? `${r.dominantColor}66` : 'rgba(255,255,255,0.1)' }} />
                        <span className="text-sm text-white/80 truncate">{r.title}</span>
                        {r.totalTime && <span className="ml-auto font-mono text-xs text-white/40">{r.totalTime}m</span>}
                      </div>
                    </Link>
                  ))}
                  {col.recipes.length > 4 && (
                    <p className="text-xs text-white/40 px-2">+{col.recipes.length - 4} more</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/30 italic">Empty</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create modal */}
      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} title="New Collection">
        <div className="space-y-4">
          <GlassInput
            label="Collection name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createCollection() }}
            placeholder="e.g. Weeknight, Holiday Baking…"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</GlassButton>
            <GlassButton variant="primary" onClick={createCollection} disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
