'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, ShoppingCart, Search, Check } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { GlassModal } from '@/components/ui/GlassModal'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

interface MealEntry {
  id: string
  date: string
  mealType: string
  recipeId: string
  recipe: { id: string; title: string; totalTime: number | null; dominantColor: string | null }
}

interface RecipeSuggestion {
  id: string
  title: string
  totalTime: number | null
  dominantColor: string | null
}

type ShoppingItem = {
  item: string
  unit: string | null
  totalAmount: number | null
  note: string | null
  recipes: string[]
}

// ── Shopping item formatter ────────────────────────────────────────────────

// Strip cooking prep from item names
const PREP_RE = /\b(finely|roughly|coarsely|thinly|thickly|freshly|finely)?\s*(diced|chopped|sliced|grated|minced|crushed|halved|quartered|peeled|deveined|trimmed|shredded|torn|cubed|butterflied|boneless|skinless|bone-in|skin-on|cooked|raw|frozen|thawed|dried|warm|cold|chilled|extra-large|large|medium|small)\b/gi

function cleanName(raw: string): string {
  let s = raw.replace(/,.*$/, '')       // drop ", finely chopped" etc.
  s = s.replace(PREP_RE, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1) // capitalise
}

// Items you just "grab one of" — no quantity needed on the list
const JUST_BUY = [
  // Fresh herbs
  'parsley','cilantro','coriander','basil','mint','dill','chive','chives',
  'rosemary','thyme','sage','tarragon','bay leaf','bay leaves',
  // Ground / dried spices & seasonings
  'salt','pepper','paprika','cumin','turmeric','cinnamon','cayenne',
  'chili powder','chilli powder','curry powder','garlic powder','onion powder',
  'nutmeg','cardamom','allspice','garam masala','red pepper flakes','chilli flakes',
  'oregano','mixed herbs','italian seasoning',
  // Oils & fats
  'olive oil','vegetable oil','canola oil','sesame oil','coconut oil','butter','ghee',
  // Condiments & sauces
  'soy sauce','fish sauce','worcestershire','hot sauce','sriracha',
  'ketchup','mustard','mayonnaise','mayo','hoisin','oyster sauce','teriyaki',
  'vinegar','balsamic','rice vinegar','apple cider vinegar',
  // Dairy liquids & soft dairy
  'half and half','heavy cream','whipping cream','double cream','single cream',
  'milk','whole milk','buttermilk','coconut milk','almond milk','oat milk',
  'sour cream','cream cheese','crème fraîche','creme fraiche','ricotta',
  // Sweeteners & baking
  'honey','maple syrup','agave','molasses',
  'flour','sugar','brown sugar','powdered sugar','icing sugar',
  'cornstarch','cornflour','baking powder','baking soda','yeast',
  'vanilla','vanilla extract','cocoa','cocoa powder',
  // Tomato products & pastes
  'tomato paste','tomato sauce','tomato puree','marinara',
  // Stocks & liquids
  'stock','broth','chicken stock','beef stock','vegetable stock','chicken broth','beef broth',
  'wine','white wine','red wine','beer','sake','mirin',
  // Grains, pasta, bread
  'rice','pasta','noodles','spaghetti','penne','fettuccine','linguine',
  'quinoa','oats','couscous','bulgur','bread','tortilla','pita','breadcrumbs',
  // Canned goods / beans
  'canned tomatoes','diced tomatoes','crushed tomatoes','chickpeas','black beans',
  'kidney beans','lentils','cannellini beans',
]

// Items sold by count (not weight)
const COUNT_ITEMS: Array<{ kw: string[]; singular: string; plural: string; g: number }> = [
  { kw: ['carrot'],              singular: 'carrot',           plural: 'carrots',          g: 61  },
  { kw: ['potato','potatoes'],   singular: 'potato',           plural: 'potatoes',         g: 170 },
  { kw: ['sweet potato'],        singular: 'sweet potato',     plural: 'sweet potatoes',   g: 200 },
  { kw: ['onion'],               singular: 'onion',            plural: 'onions',           g: 110 },
  { kw: ['shallot'],             singular: 'shallot',          plural: 'shallots',         g: 30  },
  { kw: ['tomato'],              singular: 'tomato',           plural: 'tomatoes',         g: 123 },
  { kw: ['cherry tomato'],       singular: 'cherry tomato',    plural: 'cherry tomatoes',  g: 17  },
  { kw: ['lemon'],               singular: 'lemon',            plural: 'lemons',           g: 58  },
  { kw: ['lime'],                singular: 'lime',             plural: 'limes',            g: 67  },
  { kw: ['orange'],              singular: 'orange',           plural: 'oranges',          g: 130 },
  { kw: ['avocado'],             singular: 'avocado',          plural: 'avocados',         g: 150 },
  { kw: ['apple'],               singular: 'apple',            plural: 'apples',           g: 182 },
  { kw: ['banana'],              singular: 'banana',           plural: 'bananas',          g: 118 },
  { kw: ['egg'],                 singular: 'egg',              plural: 'eggs',             g: 50  },
  { kw: ['cucumber'],            singular: 'cucumber',         plural: 'cucumbers',        g: 300 },
  { kw: ['zucchini','courgette'],singular: 'zucchini',         plural: 'zucchinis',        g: 200 },
  { kw: ['bell pepper','capsicum'],singular:'bell pepper',     plural: 'bell peppers',     g: 119 },
  { kw: ['jalapeño','jalapeno'], singular: 'jalapeño',         plural: 'jalapeños',        g: 14  },
  { kw: ['celery'],              singular: 'stick of celery',  plural: 'sticks of celery', g: 40  },
  { kw: ['ear of corn','corn on the cob'], singular: 'ear of corn', plural: 'ears of corn',g: 90  },
  { kw: ['garlic'],              singular: 'clove of garlic',  plural: 'cloves of garlic', g: 5   },
  { kw: ['leek'],                singular: 'leek',             plural: 'leeks',            g: 89  },
  { kw: ['beetroot','beet'],     singular: 'beetroot',         plural: 'beetroots',        g: 82  },
  { kw: ['eggplant','aubergine'],singular: 'eggplant',         plural: 'eggplants',        g: 458 },
  { kw: ['parsnip'],             singular: 'parsnip',          plural: 'parsnips',         g: 133 },
  { kw: ['turnip'],              singular: 'turnip',           plural: 'turnips',          g: 122 },
]

// Items sold by weight at the counter
const WEIGHT_KEYWORDS = [
  'chicken','beef','pork','lamb','veal','turkey','duck','venison',
  'steak','mince','ground','brisket','ribs','roast','tenderloin',
  'salmon','shrimp','prawn','fish','cod','tuna','tilapia','halibut','scallop','crab','lobster','mussel',
  'bacon','pancetta','prosciutto','salami','pepperoni','ham','sausage','chorizo','pancetta',
  'parmesan','mozzarella','cheddar','feta','gouda','brie','gruyere','goat cheese','tofu','tempeh',
]

// Weight conversions to grams
const TO_G: Record<string, number> = {
  g:1, gram:1, grams:1,
  kg:1000, kilogram:1000, kilograms:1000,
  oz:28.35, ounce:28.35, ounces:28.35,
  lb:453.6, lbs:453.6, pound:453.6, pounds:453.6,
}
// Volume conversions to ml
const TO_ML: Record<string, number> = {
  cup:240, cups:240,
  tablespoon:15, tablespoons:15, tbsp:15,
  teaspoon:5, teaspoons:5, tsp:5,
  ml:1, milliliter:1, milliliters:1,
  l:1000, liter:1000, liters:1000, litre:1000, litres:1000,
}
// Approx meat/produce density g/ml
const DENSITY: Record<string,number> = {
  chicken:1.05, beef:1.05, pork:1.0, lamb:1.0, fish:1.0, shrimp:0.85, salmon:1.0, cheese:1.1,
}

function toGrams(amount: number, unit: string, itemName: string): number | null {
  const u = unit.toLowerCase()
  const il = itemName.toLowerCase()
  if (TO_G[u]) return amount * TO_G[u]
  if (TO_ML[u]) {
    const d = Object.entries(DENSITY).find(([k]) => il.includes(k))?.[1] ?? 1.0
    return amount * TO_ML[u] * d
  }
  return null
}

function fmtWeight(g: number): string {
  if (g >= 900) return `${+(g/1000).toFixed(1)}kg`
  if (g >= 100) return `${Math.round(g/10)*10}g`
  return `${Math.round(g)}g`
}

const TINY_UNITS = new Set(['tsp','teaspoon','teaspoons','tbsp','tablespoon','tablespoons',
  'pinch','pinches','dash','dashes','sprig','sprigs','leaf','leaves'])
const COUNT_UNITS = new Set(['piece','pieces','slice','slices','clove','cloves',
  'stalk','stalks','stick','sticks','bunch','bunches','head','heads','can','cans',
  'jar','jars','ear','ears','medium','large','small'])

function formatShoppingItem(item: {
  item: string; unit: string | null; totalAmount: number | null; note: string | null
}): string {
  const name = cleanName(item.item)
  const nameLow = name.toLowerCase()
  const amount = item.totalAmount
  const unit = item.unit?.toLowerCase().trim() ?? ''

  // ── Just grab it — no quantity on the list ─────────────────────────────
  if (JUST_BUY.some(k => nameLow.includes(k))) return name

  // ── No usable amount ────────────────────────────────────────────────────
  if (!amount || amount === 0) return name

  // ── Tiny cooking units (tsp, pinch…) → just the name ───────────────────
  if (TINY_UNITS.has(unit)) return name

  // ── COUNT produce / eggs ────────────────────────────────────────────────
  const countDef = COUNT_ITEMS.find(c => c.kw.some(k => nameLow.includes(k)))
  if (countDef) {
    let count: number
    if (!unit || COUNT_UNITS.has(unit)) {
      count = Math.ceil(amount)
    } else {
      const g = toGrams(amount, unit, nameLow) ?? (amount * countDef.g)
      count = Math.ceil(g / countDef.g)
    }
    count = Math.max(1, count)
    // Only show count if > 1; singular → just the name
    return count === 1 ? name : `${count} ${countDef.plural}`
  }

  // ── WEIGHT items (meat, seafood, cheese) ────────────────────────────────
  if (WEIGHT_KEYWORDS.some(k => nameLow.includes(k))) {
    if (unit) {
      const g = toGrams(amount, unit, nameLow)
      if (g !== null && g >= 50) return `${fmtWeight(g)} ${name}`
    }
    // No unit or unrecognised unit → treat as count
    const count = Math.ceil(amount)
    return count === 1 ? name : `${count} ${name}`
  }

  // ── Known count/display units ───────────────────────────────────────────
  if (COUNT_UNITS.has(unit)) {
    const count = Math.ceil(amount)
    return count === 1 ? name : `${count} ${name}`
  }

  // ── Known weight/volume units ───────────────────────────────────────────
  if (TO_G[unit] || TO_ML[unit]) {
    const g = toGrams(amount, unit, nameLow)
    if (g !== null && g >= 50) return `${fmtWeight(g)} ${name}`
    return name  // tiny amount → just buy some
  }

  // ── Fallback ────────────────────────────────────────────────────────────
  const count = Math.ceil(amount)
  return count === 1 ? name : `${count} ${name}`
}

// ──────────────────────────────────────────────────────────────────────────
export default function MealPlanPage() {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()))
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [addDate, setAddDate] = useState<string | null>(null)
  const [addMealType, setAddMealType] = useState<string>('dinner')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([])
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [shoppingList, setShoppingList] = useState<Record<string, ShoppingItem[]>>({})
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const start = formatDate(monday)
  const end = formatDate(new Date(monday.getTime() + 6 * 86400000))

  const loadEntries = useCallback(async () => {
    const res = await fetch(`/api/meal-plan?start=${start}&end=${end}`)
    const data = await res.json() as MealEntry[]
    setEntries(data)
  }, [start, end])

  useEffect(() => { loadEntries() }, [loadEntries])

  const prevWeek = () => { const d = new Date(monday); d.setDate(d.getDate() - 7); setMonday(d) }
  const nextWeek = () => { const d = new Date(monday); d.setDate(d.getDate() + 7); setMonday(d) }

  const addEntry = async (recipeId: string) => {
    if (!addDate) return
    setBusy(true)
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: addDate, recipeId, mealType: addMealType }),
    })
    if (res.ok) {
      await loadEntries()
      setAddDate(null)
      setSearchQuery('')
      setSuggestions([])
    }
    setBusy(false)
  }

  const removeEntry = async (id: string) => {
    await fetch(`/api/meal-plan/${id}`, { method: 'DELETE' })
    loadEntries()
  }

  const searchRecipes = async (q: string) => {
    setSearchQuery(q)
    const res = await fetch(`/api/recipes${q.length >= 2 ? `?search=${encodeURIComponent(q)}&sort=recent` : '?sort=recent'}`)
    const data = await res.json() as RecipeSuggestion[]
    setSuggestions(Array.isArray(data) ? data : [])
  }

  // Pre-load all recipes when the add modal opens
  useEffect(() => {
    if (!addDate) { setSuggestions([]); return }
    setSearchQuery('')
    fetch('/api/recipes?sort=recent')
      .then(r => r.json())
      .then((data: RecipeSuggestion[]) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
  }, [addDate])

  const loadShoppingList = async () => {
    const res = await fetch(`/api/shopping-list?start=${start}&end=${end}`)
    const data = await res.json() as Record<string, ShoppingItem[]>
    setShoppingList(data)
    setCheckedItems(new Set())
    setShoppingOpen(true)
  }

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d
  })

  const getEntriesForDay = (date: Date, mealType: string) =>
    entries.filter(e => e.date === formatDate(date) && e.mealType === mealType)

  return (
    <div className="px-6 pb-16 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" size="sm" onClick={prevWeek}><ChevronLeft className="h-5 w-5" /></GlassButton>
          <h1 className="font-display text-2xl font-bold text-white">
            {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {new Date(monday.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h1>
          <GlassButton variant="ghost" size="sm" onClick={nextWeek}><ChevronRight className="h-5 w-5" /></GlassButton>
        </div>
        <GlassButton variant="primary" size="md" onClick={loadShoppingList}>
          <ShoppingCart className="h-4 w-4" /> Shopping List
        </GlassButton>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dateStr = formatDate(day)
          const isToday = dateStr === formatDate(new Date())
          return (
            <GlassCard key={dateStr} className={`p-3 ${isToday ? 'ring-1 ring-brand-saffron/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">{DAYS[day.getDay()]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-brand-saffron' : 'text-white'}`}>
                    {day.getDate()}
                  </p>
                </div>
                <GlassButton
                  variant="ghost" size="sm"
                  onClick={() => { setAddDate(dateStr); setAddMealType('dinner'); setSearchQuery(''); setSuggestions([]) }}
                >
                  <Plus className="h-3 w-3" />
                </GlassButton>
              </div>

      {MEAL_TYPES.map(mt => {
                const dayEntries = getEntriesForDay(day, mt)
                if (dayEntries.length === 0) return null
                return (
                  <div key={mt} className="mb-1.5">
                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{mt}</p>
                    {dayEntries.map(entry => (
                      <div key={entry.id}
                        className="flex items-center gap-1 group py-0.5 px-1 rounded hover:bg-glass-white/10 transition-colors"
                      >
                        <span className="flex-1 text-xs text-white/80 truncate" title={entry.recipe.title}>
                          {entry.recipe.title}
                        </span>
                        {entry.recipe.totalTime && (
                          <span className="text-[10px] text-white/40 font-mono shrink-0">{entry.recipe.totalTime}m</span>
                        )}
                        <button
                          onClick={() => removeEntry(entry.id)}
                          aria-label={`Remove ${entry.recipe.title}`}
                          className="ml-1 shrink-0 text-white/30 hover:text-brand-tomato transition-colors
                                     md:opacity-0 md:group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {entries.filter(e => e.date === formatDate(day)).length === 0 && (
                <p className="text-xs text-white/20 italic py-1">No meals</p>
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* Add Recipe Modal */}
      <GlassModal open={!!addDate} onClose={() => setAddDate(null)} title={`Add to ${addDate ?? ''}`}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map(mt => (
              <GlassButton
                key={mt}
                variant={addMealType === mt ? 'primary' : 'default'}
                size="sm"
                onClick={() => setAddMealType(mt)}
                className="capitalize"
              >
                {mt}
              </GlassButton>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => searchRecipes(e.target.value)}
              placeholder="Search recipes…"
              className="w-full rounded-glass-sm border border-glass-border bg-glass-white py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/40 outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {suggestions.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">
                {searchQuery.length > 0 ? 'No recipes match that search.' : 'No recipes in your library yet.'}
              </p>
            ) : (
              suggestions.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => addEntry(rec.id)}
                  disabled={busy}
                  className="w-full text-left px-3 py-2.5 rounded-glass-sm hover:bg-glass-white text-sm text-white/80 flex items-center justify-between transition-colors disabled:opacity-40"
                >
                  <span>{rec.title}</span>
                  {rec.totalTime && <span className="text-xs text-white/40 font-mono ml-2 shrink-0">{rec.totalTime}m</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </GlassModal>

      {/* Shopping List Modal */}
      <GlassModal open={shoppingOpen} onClose={() => setShoppingOpen(false)} title="Shopping List">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {Object.keys(shoppingList).length === 0 ? (
            <p className="text-sm text-white/50">No meals planned this week. Add some recipes first!</p>
          ) : (
            Object.entries(shoppingList).map(([aisle, items]) => (
              <div key={aisle}>
                <h3 className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
                  {aisle}
                  <span className="text-xs font-normal text-white/40">({items.length})</span>
                </h3>
                <div className="space-y-0.5">
                  {items.map((item, idx) => {
                    const key = `${aisle}-${item.item}-${idx}`
                    const checked = checkedItems.has(key)
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-3 py-1.5 px-1 rounded-glass-sm cursor-pointer hover:bg-glass-white/10 transition-colors"
                      >
                        <span
                          onClick={() => toggleCheck(key)}
                          className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                            checked ? 'bg-brand-basil border-brand-basil' : 'border-glass-border bg-glass-white'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span className={`text-sm flex-1 transition-all ${checked ? 'line-through opacity-30' : 'text-white/90'}`}>
                          {formatShoppingItem(item)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassModal>
    </div>
  )
}
