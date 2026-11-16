'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { useUI } from '@/lib/ui/store'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import { ProductImage } from './product-image'

export type SearchProduct = { slug: string; name: string; price: number; image: string | null; aroma: string | null; category: string }
export type SearchOption = { slug: string; name: string; count: number }

/** Поиск ⌘K / Ctrl+K: товары с фото, ароматы, категории. Работает в браузере (подходит для GitHub Pages). */
export function SearchCommand({ products, aromas, categories }: { products: SearchProduct[]; aromas: SearchOption[]; categories: SearchOption[] }) {
  const open = useUI((s) => s.searchOpen)
  const setOpen = useUI((s) => s.setSearchOpen)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!useUI.getState().searchOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t.search.open}
      description={t.search.placeholder}
      className="rounded-none! border-none bg-cream ring-0 sm:max-w-xl"
    >
      <Command className="bg-transparent">
      <CommandInput placeholder={t.search.placeholder} />
      <CommandList className="max-h-[60dvh]">
        <CommandEmpty>{t.search.empty}</CommandEmpty>
        <CommandGroup heading={t.search.products}>
          {products.map((p) => (
            <CommandItem key={p.slug} value={`${p.name} ${p.aroma ?? ''} ${p.category}`} onSelect={() => go(`/product/${p.slug}`)} className="gap-3 py-2">
              <ProductImage src={p.image} alt="" sizes="40px" className="size-10 shrink-0" imgClassName="p-0.5" />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground">{formatPrice(p.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t.search.aromas}>
          {aromas.map((a) => (
            <CommandItem key={a.slug} value={`аромат ${a.name}`} onSelect={() => go(`/catalog?aroma=${a.slug}`)}>
              <span className="accent-serif flex-1 text-base">{a.name}</span>
              <span className="text-xs text-muted-foreground">{a.count}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t.search.categories}>
          {categories.map((c) => (
            <CommandItem key={c.slug} value={`категория ${c.name}`} onSelect={() => go(`/catalog?category=${c.slug}`)}>
              <span className="flex-1 uppercase tracking-[0.14em]">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.count}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
