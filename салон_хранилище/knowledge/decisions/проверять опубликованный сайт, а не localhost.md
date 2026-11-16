---
tags: [decision, workflow, feedback]
date: 2026-11-16
---

# Проверять опубликованный сайт, а не localhost

**Просьба пользователя (2026-11-16):** «на локалхосте не открывай ничего».

**Как теперь проверяем:**
- код — через CLI: `pnpm typecheck`, `pnpm lint`, `pnpm test:bot`, `pnpm build`, `pnpm build:pages`;
- живой результат — `curl` по адресам и браузер только на https://sarrinoj-glitch.github.io/lunara-shop/;
- локальный dev-сервер и `localhost` в браузере не открываем.

Связано с [[в скрытой панели браузера анимации и IntersectionObserver замирают]], [[витрина публикуется на GitHub Pages статической сборкой]].
