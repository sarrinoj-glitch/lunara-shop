---
tags: [debugging, shadcn, cmdk]
date: 2026-11-16
---

# CommandDialog из shadcn требует обёртку Command

**Симптом:** при открытии поиска ⌘K падает `Cannot read properties of undefined (reading 'subscribe')` в `CommandInput`.

**Причина:** в новой версии shadcn (стиль radix-nova) `CommandDialog` рендерит только `Dialog` и `DialogContent`, а контекст cmdk (`<Command>`) внутрь не кладёт.

**Решение:** в `components/shop/search-command.tsx` содержимое обёрнуто так:
```tsx
<CommandDialog …>
  <Command className="bg-transparent">
    <CommandInput … />
    <CommandList>…</CommandList>
  </Command>
</CommandDialog>
```

Связано с [[вторая версия витрины живёт в ветке v2 и публикуется в подпапке v2]].
