---
tags: [debugging, github-pages, ci]
date: 2026-11-16
---

# Окружение GitHub Pages разрешает деплой только из указанных веток

**Симптом:** workflow, запущенный пушем в ветку `v2`, собирается, но шаг `deploy` в окружение `github-pages` не проходит.

**Причина:** при включении Pages окружение получает `custom_branch_policies: true`, а в разрешённых ветках только `main`.

**Проверка и решение:**
```bash
gh api repos/<owner>/<repo>/environments/github-pages/deployment-branch-policies --jq '.branch_policies[].name'
gh api -X POST repos/<owner>/<repo>/environments/github-pages/deployment-branch-policies -f name=v2 -f type=branch
```

**Сейчас:** `v2` добавлена в разрешённые ветки. После слияния `v2` в `main` workflow реагирует только на `main`, так что это правило больше не используется.

**Ещё:** у workflow `concurrency: cancel-in-progress`, поэтому новый запуск отменяет предыдущий. Это нормально.

Связано с [[витрина публикуется на GitHub Pages статической сборкой]].
