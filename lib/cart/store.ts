'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  image: string | null
  qty: number
  /** проставляется после сверки с сервером */
  unavailable?: boolean
  priceChanged?: boolean
}

type CartState = {
  items: CartItem[]
  open: boolean
  /** счётчик «подпрыгивания» иконки корзины */
  bump: number
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => CartItem | undefined
  restore: (item: CartItem) => void
  clear: () => void
  setOpen: (open: boolean) => void
  sync: (fresh: { productId: string; price: number; available: boolean }[]) => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      bump: 0,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId)
          const items = existing
            ? s.items.map((i) => (i.productId === item.productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
            : [...s.items, { ...item, qty }]
          return { items, bump: s.bump + 1 }
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i)),
        })),
      remove: (productId) => {
        const item = get().items.find((i) => i.productId === productId)
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }))
        return item
      },
      restore: (item) => set((s) => ({ items: [...s.items, item] })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
      sync: (fresh) =>
        set((s) => ({
          items: s.items.map((i) => {
            const f = fresh.find((x) => x.productId === i.productId)
            if (!f || !f.available) return { ...i, unavailable: true }
            return { ...i, unavailable: false, priceChanged: f.price !== i.price, price: f.price }
          }),
        })),
    }),
    {
      name: 'ambra-cart',
      // На сервере (SSR) хранилища нет — persist просто ничего не делает
      storage: createJSONStorage(() => (typeof window === 'undefined' ? (undefined as unknown as Storage) : window.localStorage)),
      partialize: (s) => ({ items: s.items }),
    },
  ),
)

export const cartTotal = (items: CartItem[]) =>
  items.filter((i) => !i.unavailable).reduce((sum, i) => sum + i.price * i.qty, 0)

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.qty, 0)
