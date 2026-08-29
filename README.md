# Adobe Stock Metadata Generator

An AI-powered web app that automatically generates optimized metadata for your stock photos — following official Adobe Stock guidelines.

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat&logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=flat&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## Features

- **AI Metadata Generation** — Upload a photo and get an optimized title, keywords, and category instantly using Google Gemini Vision
- **Adobe Stock Compliant** — Follows official Adobe Stock metadata guidelines (title ≤70 chars, 15–49 keywords, proper keyword ordering)
- **Smart Keyword Reorder** — When you edit the title, the top 10 keywords automatically reorder based on relevance — without adding or removing any keywords
- **Drag & Drop Reorder** — Manually reorder keywords by dragging chips
- **Keyword Management** — Add or remove keywords manually; top 10 are highlighted with rank badges
- **Export CSV** — Export all metadata in CSV format ready for Adobe Stock bulk upload
- **Dark Theme UI** — Clean split-panel interface built for photographer workflows

---

## Tech Stack

- **Frontend + Backend:** SvelteKit 2 + Svelte 4
- **Styling:** Tailwind CSS
- **AI Vision:** Google Gemini 3.6 Flash
- **Drag & Drop:** svelte-dnd-action
- **Deployment:** Vercel

---

## Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Tito-Rollis/adobe-metadata-app.git
cd adobe-metadata-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your Gemini API key to .env

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Usage

1. **Upload photos** — drag & drop or click to browse (supports multiple files)
2. **Click Generate** — AI analyzes the image and fills in title, keywords, and category
3. **Edit as needed** — modify the title, add/remove keywords, change category
4. **Reorder keywords** — drag chips to reorder, or edit the title to auto-reorder top 10
5. **Export CSV** — click Export CSV to download metadata for Adobe Stock bulk upload

---

## Adobe Stock Guidelines Applied

- Title: natural language, ideally under 70 characters
- Keywords: single words preferred; multi-word only for proper nouns (e.g. `golden retriever`, `Eiffel Tower`)
- First 10 keywords carry the most search weight — kept most relevant to the title
- No brand names, no keyword spamming, no redundant synonyms

---

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## License

MIT
