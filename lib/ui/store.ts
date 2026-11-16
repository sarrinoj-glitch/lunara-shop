'use client'

import { create } from 'zustand'
import type { CatalogProduct } from '@/lib/catalog/types'

/** Глобальное состояние оверлеев: поиск ⌘K и быстрый просмотр товара. */
type UIState = {
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  quickView: CatalogProduct | null
  openQuickView: (p: CatalogProduct) => void
  closeQuickView: () => void
}

export const useUI = create<UIState>()((set) => ({
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  quickView: null,
  openQuickView: (quickView) => set({ quickView }),
  closeQuickView: () => set({ quickView: null }),
}))
