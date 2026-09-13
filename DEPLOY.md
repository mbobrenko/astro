# Как развернуть Astro в интернет

Проект состоит из двух частей, разворачиваются раздельно:

- **backend/** — Express-прокси к AstrologyAPI, держит ключ в секрете → хостинг для Node.js (Render).
- **frontend/** — Vite/React, после сборки просто статика → статический хостинг с CDN (Vercel).

В корне уже лежат готовые конфиги: `render.yaml` (Render подхватит его автоматически при создании Blueprint) и `frontend/vercel.json`.

## Шаг 1. Залить код на GitHub

В PowerShell, в папке `C:\Users\mbobr\Astro`:

```powershell
git init
git add .
git commit -m "Initial commit"
```

Проверьте перед этим `git status` — в списке НЕ должно быть `backend/.env` и `frontend/.env` (в них ключи/локальные адреса). Если всё же попали — сначала поправьте `.gitignore`, `git rm --cached backend/.env frontend/.env`, и закоммитьте заново.

Создайте пустой репозиторий на github.com (без README/gitignore — они уже есть), затем:

```powershell
git remote add origin https://github.com/ВАШ_ЛОГИН/astro.git
git branch -M main
git push -u origin main
```

## Шаг 2. Backend → Render

1. render.com → **New → Blueprint** → подключите репозиторий astro.
2. Render сам прочитает `render.yaml` и создаст сервис `astro-backend` с root directory `backend`, командами `npm install` / `npm start`.
3. Откроется запрос на два секрета — впишите:
   - `ASTROLOGY_API_KEY` = ваш реальный ключ с astrologyapi.com
   - `ALLOWED_ORIGIN` = пока оставьте `http://localhost:5173`, вернётесь на шаге 4
4. Deploy. Получите адрес вида `https://astro-backend-xxxx.onrender.com` — проверьте, что `https://astro-backend-xxxx.onrender.com/api/health` отвечает `{"ok":true}`.

Бесплатный тариф Render засыпает после 15 минут без запросов, первый запрос после этого грузится около минуты — для теста ок, для постоянной нагрузки позже можно перейти на платный (от $7/мес).

## Шаг 3. Frontend → Vercel

1. vercel.com → **New Project** → тот же репозиторий.
2. Root Directory: `frontend` (Framework Preset Vite определится сам, `vercel.json` уже задаёт build/output на всякий случай).
3. Environment Variables → `VITE_API_BASE` = адрес backend из шага 2 (`https://astro-backend-xxxx.onrender.com`).
4. Deploy. Получите публичный адрес вида `https://astro-frontend.vercel.app`.

## Шаг 4. Вернуться в Render

В настройках `astro-backend` → Environment → поменяйте `ALLOWED_ORIGIN` на адрес из Vercel (`https://astro-frontend.vercel.app`) → Save (сервис передеплоится сам).

## Проверка

Откройте адрес Vercel в браузере, попробуйте построить карту — если backend ещё «спит» (Render free), первый запрос может занять ~30-60 секунд.

## На будущее

- Любой git push в main — автоматически передеплоит обе части (и Render, и Vercel следят за репозиторием).
- Ключ AstrologyAPI — trial, у него лимит запросов. Для публичного использования проверьте лимит в личном кабинете astrologyapi.com и при необходимости перейдите на платный план.
- Свой домен вместо `*.vercel.app` — Vercel → Settings → Domains, укажете DNS у регистратора.
