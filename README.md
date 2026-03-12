# ГИТ ВОВА — личный архив проектов 🗂️

## 📌 О проекте
Веб‑приложение для хранения и демонстрации моих учебных и пет‑проектов (ZIP). Есть админка, загрузка ZIP, фильтры, темы и README‑модалки.

## 🚀 Функционал
- Просмотр проектов (карточки с описанием, размером, датой)
- Фильтрация по типу (HTML/CSS, JavaScript)
- Загрузка ZIP‑файлов через админку (drag&drop)
- Удаление ZIP‑проектов в админке
- README‑модалки с Markdown‑описанием (если README.md лежит внутри ZIP)
- Тёмная и светлая темы
- Полностью адаптивно

## 🛠️ Стек технологий
- Фронтенд: HTML, CSS, vanilla JavaScript
- Бэкенд: Express + multer + adm-zip
- Хранилище: папка `downloads/` (ZIP‑файлы)
- Анимации/эффекты: AOS, GSAP, VanillaTilt
- Деплой: Render (бэкенд), Vercel (фронтенд)

## 🔧 Локальный запуск

```bash
npm install
npm run dev
```

Открой сайт:
- `http://localhost:3001/`

Админка:
- `http://localhost:3001/admin?key=vova777`

Пароль админа (заголовок `x-admin-token`) по умолчанию:
- `vova-admin-2026`

Можно переопределить через переменные окружения:
- `ADMIN_TOKEN`
- `ADMIN_PAGE_TOKEN`
- `PORT`

## 🌍 Продакшен

### Важно про API (без хардкода localhost)
Фронт умеет работать с отдельным бэкендом.

Есть 2 способа указать API:
- **через query-параметр**: `?api=https://your-backend.onrender.com`
- **через localStorage**:

Открой фронт, затем в консоли браузера:

```js
localStorage.setItem('gitvova_api_base', 'https://your-backend.onrender.com');
location.reload();
```

### Render (backend)
1. Создай новый Web Service из репозитория.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Добавь переменные окружения:
   - `ADMIN_TOKEN` (любой секретный пароль)
   - `ADMIN_PAGE_TOKEN` (ключ для `/admin?key=...`)

После деплоя получишь URL вида:
- `https://your-backend.onrender.com`

### Vercel (frontend)
1. Задеплой репозиторий на Vercel как Static site.
2. После деплоя открой фронт по URL и задай API одним из способов выше.

Бэкенд:
- `https://your-backend.onrender.com`

Фронтенд:
- `https://your-frontend.vercel.app`

## 📦 Структура
- `server.js` — Express API + upload/delete + раздача статики
- `downloads/` — ZIP‑проекты (не коммитить)
- `index.html` / `projects.html` / `about.html` / `contacts.html` / `admin.html` — страницы
- `css/` — стили (темы, адаптив, карточки)
- `js/` — логика (загрузка проектов, модалки, тема, UX)

## 📸 Скриншоты
(добавишь позже)

## 👨‍💻 Автор
Вова, 14 лет

