'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CatalogSort } from '@/lib/catalog/types'

type Opt = { slug: string; name: string; count: number }

function Chip({ active, onClick, children, layoutGroup }: { active: boolean; onClick: () => void; children: React.ReactNode; layoutGroup: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors',
        active ? 'border-espresso text-ivory' : 'border-line text-espresso hover:border-espresso',
      )}
    >
      {active ? <motion.span layoutId={layoutGroup} className="absolute inset-0 -z-0 rounded-full bg-espresso" transition={{ type: 'spring', stiffness: 400, damping: 34 }} /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export function CatalogFilters({
  categories,
  aromas,
  active,
}: {
  categories: Opt[]
  aromas: Opt[]
  active: { category?: string; aroma?: string; sort: CatalogSort; q?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(active.q ?? '')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.location.hash === '#search') searchRef.current?.focus()
  }, [])

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }))
  }

  // поиск с задержкой
  useEffect(() => {
    if ((active.q ?? '') === q) return
    const id = setTimeout(() => update({ q: q.trim() || undefined }), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className={cn('mb-10 space-y-4 transition-opacity', pending && 'opacity-60')} id="search">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex flex-1 items-center border-b border-espresso/40 focus-within:border-terracotta">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">{t.common.search}</span>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="h-11 w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/70"
            type="search"
            enterKeyHint="search"
          />
          {q ? (
            <button type="button" onClick={() => setQ('')} aria-label={t.common.close} className="text-muted-foreground hover:text-terracotta">
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
        <Select value={active.sort} onValueChange={(v) => update({ sort: v === 'new' ? undefined : v })}>
          <SelectTrigger className="h-11 w-full rounded-full border-line bg-transparent px-5 md:w-56" aria-label={t.catalog.sort}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-ivory">
            {(Object.keys(t.catalog.sortOptions) as CatalogSort[]).map((k) => (
              <SelectItem key={k} value={k}>
                {t.catalog.sortOptions[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip layoutGroup="cat" active={!active.category} onClick={() => update({ category: undefined })}>
          {t.catalog.all}
        </Chip>
        {categories.map((c) => (
          <Chip key={c.slug} layoutGroup="cat" active={active.category === c.slug} onClick={() => update({ category: c.slug })}>
            {c.name} <sup className="text-[9px] opacity-70">{c.count}</sup>
          </Chip>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip layoutGroup="aroma" active={!active.aroma} onClick={() => update({ aroma: undefined })}>
          {t.catalog.allAromas}
        </Chip>
        {aromas.map((a) => (
          <Chip key={a.slug} layoutGroup="aroma" active={active.aroma === a.slug} onClick={() => update({ aroma: a.slug })}>
            <span className="accent-serif text-sm normal-case tracking-normal">{a.name}</span>
          </Chip>
        ))}
      </div>
    </div>
  )
}
