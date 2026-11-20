# Ündes — Digital Poetry Library

> **Әр өлеңнің өз үні бар** — every poem has its own voice.

A premium, minimalist digital poetry library uniting three literary
cultures — Kazakh, Russian and English — in one quiet, readable space.

Ündes ships as a self-contained static front-end (HTML + CSS + Vanilla
JS modules) that runs out of the box in **demo mode** backed by
`localStorage`, and transparently upgrades to a **Supabase + PostgreSQL**
backend the moment you supply credentials. The data-access layer
(`api.js`) is the single seam: no component or page ever talks to
Supabase or storage directly.

---

## ✨ Features

- **3-language UI** (Қазақша · Русский · English) — the interface
  translates; original poems always stay in their original language.
- **Dark / light theme** with system-preference detection, persisted.
- **10 fully-built pages**: home, explore (catalog), poem (reading
  view + reading mode), authors, author, mood (Poetry by Mood),
  favorites, profile, login/register, submit.
- **Poetry by Mood** — 8 interactive mood cards (Love, Sadness,
  Inspiration, Loneliness, Nature, Dreams, Freedom, Philosophy).
- **Poem page** with original text, language chip, theme chips, year,
  verified translations (kept separate from the original), favorites,
  copy, share (Web Share API), Text-to-Speech playback with a progress
  bar, and a shareable **quote card** exportable as PNG.
- **Reading mode** — distraction-free full-text view, toggled in one
  click, exits with `Esc`.
- **Instant search** with debounced results, language + theme filters,
  sort by popularity / recency / title, paginated.
- **Auth** (demo or Supabase Auth), **favorites**, **reading history**,
  **user submissions** with a moderation queue (status: `pending` →
  `approved`), **ratings**.
- **Toast notifications**, **skeleton loaders**, **empty / error
  states**, **modals**.
- **Fully responsive** down to 375px, mobile nav, no horizontal
  overflow.

---

## 🎨 Design

| Token      | Value     |
| ---------- | --------- |
| Background | `#F5F1E8` |
| Surface    | `#FFFFFF` |
| Primary    | `#823D46` |
| Text       | `#25231F` |
| Secondary  | `#858078` |

Type: **Playfair Display** (headings) + **Inter** (interface). Generous
whitespace, large editorial titles, subtle hover micro-animations,
no neon gradients / glassmorphism.

---

## 🚀 Run locally

It's a static site — pick any HTTP server:

```bash
cd undes-flat
python3 -m http.server 8765
# open http://localhost:8765/index.html
```

`file://` works too, but an HTTP server is recommended so
`SpeechSynthesis` and clipboard APIs behave consistently.

---

## 🌐 Deploy to GitHub Pages

This is a **flat** build: every file lives in the project root — no
`pages/` or `assets/` subdirectories. That is deliberate, because the
GitHub **web upload UI flattens folder structure**, which breaks
`../assets/...` paths. A flat layout has nothing to flatten.

1. Create a public repo (e.g. `Undes`).
2. **Settings → Pages → Build and deployment → Source = `Deploy from a branch`**, branch `main`, folder `/ (root)`.
3. Upload **all 39 files from this folder** to the repo root. Two ways:
   - **Web UI**: *Add file → Upload files*, drag every file at once.
     Because nothing is in a subfolder, GitHub cannot flatten it.
   - **git CLI** (recommended):
     ```bash
     git clone https://github.com/<you>/Undes.git
     # copy all 39 files into Undes/ (overwrite the placeholder index.html)
     cd Undes
     git add .
     git status          # expect ~39 files, not 2
     git commit -m "Add Ündes flat build"
     git push
     ```
4. Wait 1–2 minutes. Your site is live at
   `https://<you>.github.io/Undes/`.

> **File name collisions were resolved**: page scripts are renamed
> `home-page.js`, `explore-page.js`, …, `submit-page.js` (instead of
> sharing the `data/` file names), and `pages/authors.html` lives at
> `authors.html` next to `authors.js`.

---

## 🔌 Connect Supabase (optional)

1. Create a Supabase project.
2. Run [`schema.sql`](schema.sql) in the SQL editor —
   it creates all tables, indexes, triggers and **RLS policies**.
3. Copy [`env.example.js`](env.example.js) to `env.js` (gitignored)
   and fill in your project URL + anon public key.
4. Load the Supabase JS SDK **and** `env.js` on every page, right
   before the other Ündes scripts. Add these two lines to each
   `*.html` head (already templated for you — just uncomment):

   ```html
   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
   <script src="env.js"></script>
   ```

That's it — `config.js` detects Supabase automatically and `api.js`
switches every method to the database. No component changes required.

> Only the **anon public** key belongs in client code. The
> `service_role` key is for server-side moderation only.

---

## 🗄️ Data model

| Table              | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `profiles`         | 1:1 with `auth.users`, name + avatar          |
| `authors`          | Poets (KZ/RU/EN), bios in 3 languages         |
| `categories`       | Themes (love, nature, philosophy, …)         |
| `poems`            | Title, content, language, author, status     |
| `translations`     | Verified poetic translations, kept separate   |
| `favorites`        | user × poem                                   |
| `ratings`          | user × poem × 1–5                             |
| `reading_history`  | user × poem × read_at                         |
| `user_submissions` | Moderation queue (pending/approved/rejected)  |

All tables have RLS enabled. Public can read approved poems; users
own their favorites, ratings, history and submissions. See the
policies block at the bottom of `schema.sql`.

---

## 🧱 Architecture

```
index.html, explore.html, poem.html,        ← one HTML file per route
  authors.html, author.html, mood.html,       (all flat in the root)
  favorites.html, profile.html,
  login.html, submit.html

styles.css                  ← full design system, light + dark

authors.js                  ← static, public-domain content
poems.js                      (verified, public-domain texts)
categories.js
i18n.js                       (interface dictionary, 3 languages)

config.js                   ← env + feature flags
storage.js                  ← localStorage wrapper (demo persistence)
api.js                      ← ★ single data-access seam (demo ⇄ Supabase)
auth.js                     ← demo + Supabase Auth
tts.js                      ← SpeechSynthesis wrapper
ui.js                       ← i18n + theme + toast + modal services

layout.js                   ← navbar + footer renderers
cards.js                    ← poem-card, author-card, mood-card, skeletons
quote-card.js               ← shareable quote card + PNG export

bootstrap.js                 ← page lifecycle + global wiring

home-page.js, explore-page.js, ...    ← one init file per route
  poem-page.js, author-page.js,          (renamed with -page suffix so
  authors-page.js, mood-page.js,         they never clash with the
  favorites-page.js, profile-page.js,    data files above)
  login-page.js, submit-page.js

env.example.js               ← Supabase config template
schema.sql                   ← DDL + RLS policies
```

> The original source tree (`pages/`, `assets/css/`, `assets/js/data/`,
> `assets/js/services/`, …) lives in `undes.zip`. This flat build is a
> deployment-friendly copy where every file sits at the repo root.

**Rules respected:**

- UI, business logic and data access are separate layers.
- No component touches Supabase or `localStorage` directly — only
  through `api.js` / `auth.js` / `storage.js`.
- Reusable components (cards, navbar, footer, modal, toast).
- Modular ES files, no monolithic script.

---

## 📚 Content & licensing

All poems are **public-domain** works (authors deceased 70+ years ago),
reproduced from established editions. Texts include:

- **Kazakh**: Абай Құнанбайұлы, Мағжан Жұмабаев, Мұқағали Мақатаев
- **Russian**: А. С. Пушкин, М. Ю. Лермонтов, С. А. Есенин
- **English**: W. Shakespeare, E. A. Poe, R. Frost

No author is attributed a poem they did not write. Verified
translations are kept in a separate `translations` table / array and
shown below the original, never replacing it.

---

## 🛠️ Tech stack

HTML5 · Tailwind-free hand-authored CSS · Vanilla JS (ES modules-style
namespacing) · Lucide Icons · Supabase (Postgres + Auth + Storage) ·
Web Speech API · Web Share API.

---

Made with love for poetry. © Ündes.
