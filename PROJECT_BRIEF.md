# Adobe Stock Auto Metadata App — Project Brief

## Status
- **Live:** https://adobe-metadata-app.vercel.app
- **Repo:** https://github.com/Tito-Rollis/adobe-metadata-app (public)
- **Last updated:** August 2026

---

## Tujuan
Web app untuk auto-generate metadata foto sesuai standar Adobe Stock.
User upload foto, AI (Gemini Vision) analisis gambar, lalu generate title + keywords secara otomatis.

---

## Tech Stack (Final)
- **Frontend + Backend:** SvelteKit 2 + Svelte 4
- **Styling:** Tailwind CSS 3
- **AI Vision:** Google Gemini 3.6 Flash (free tier, 1.500 req/hari)
- **Drag & Drop:** svelte-dnd-action
- **Deploy:** Vercel (adapter-vercel)
- **Repo:** GitHub (public)

---

## Struktur File
```
src/
├── app.html
├── app.css                          # Tailwind base + custom scrollbar
├── lib/
│   ├── constants.js                 # Adobe Stock categories, limits
│   ├── stores/
│   │   └── photoStore.js            # Svelte store: photos, selectedPhoto, reorderKeywordsByTitle
│   └── components/
│       ├── Header.svelte            # Logo + Export CSV button
│       ├── FileList.svelte          # Panel kiri: upload + list foto
│       └── MetadataEditor.svelte    # Panel kanan: title, keywords, category editor
└── routes/
    ├── +layout.svelte
    ├── +page.svelte                 # Main page (split panel layout)
    └── api/
        └── generate/
            └── +server.js           # POST /api/generate — Gemini Vision API call
```

---

## Fitur

1. **Upload Foto** — drag & drop atau klik, multiple files
2. **Auto-Generate Metadata** — Gemini Vision generate title + keywords + category
3. **Edit Metadata Manual** — edit title, keywords, category
4. **Drag & Drop Reorder Keywords** — reorder keyword chips secara manual
5. **Smart Keyword Reorder saat Title Berubah**
   - Saat title diedit (debounce 600ms), top 10 keywords otomatis di-rerank berdasarkan relevansi ke title baru
   - Keywords yang ada TIDAK berubah, TIDAK ditambah, TIDAK dihapus — hanya urutan yang berubah
   - Keyword dari posisi 11+ bisa swap masuk top 10 kalau score-nya lebih tinggi
6. **Auto Reorder saat Keyword Ditambah Manual** — keyword baru langsung masuk posisi yang tepat berdasarkan title
7. **Export CSV** — format siap upload ke Adobe Stock Contributor Portal

---

## Aturan Metadata Adobe Stock

### Title
- Ideal 70 karakter, max 200
- Natural language, deskriptif, unik per foto
- Harus menjawab: Who, Where, What, When, Mood, Concept
- Keyword paling relevan harus muncul di title DAN top 10 keywords
- Hindari: brand name, nama orang, istilah teknis kamera

### Keywords
- Maks 49, optimal 15–35
- **10 keyword pertama paling penting** di search Adobe Stock
- Bahasa: English
- Format: **single word** (contoh: beach, woman, sunset)
- **Exception:** proper noun / compound noun yang tidak bisa dipisah (golden retriever, Eiffel Tower, Great Barrier Reef)
- Hindari: brand names, sinonim berlebihan, keyword spam

---

## Design
- **Theme:** Dark (navy dark)
- **Layout:** Split panel — file list (kiri) + metadata editor (kanan)
- **Colors:**
  - bg-primary: `#1a1a2e`
  - bg-secondary: `#16213e`
  - accent: `#e8441a` (Adobe orange-red)
  - text-muted: `#8888aa`
- Top 10 keywords ditandai dengan badge nomor berwarna accent

---

## Environment Variables
```env
GEMINI_API_KEY=...   # Google Gemini API key (di .env lokal & Vercel Secret)
```
- `.env` tidak di-commit ke GitHub (ada di .gitignore)
- Di Vercel disimpan sebagai Secret (production)

---

## Keputusan Teknis
- Pakai **Svelte 4** (bukan 5) karena svelte-dnd-action belum support Svelte 5
- Pakai **SvelteKit** sekalian untuk backend API routes (tidak perlu Node/Express terpisah)
- Model Gemini: **gemini-3.6-flash** (model terbaru yang tersedia, 2026)
- Tidak integrasi ImStocker API (berbayar), hanya Gemini

---

## Cara Lanjut Development
```bash
git clone https://github.com/Tito-Rollis/adobe-metadata-app.git
cd adobe-metadata-app
npm install
cp .env.example .env
# Isi GEMINI_API_KEY di .env
npm run dev
```

Untuk deploy ulang ke Vercel:
```bash
vercel --prod
```

---

## Referensi
- https://helpx.adobe.com/stock/contributor/help/artist-hub-migration/maximize-metadata-to-get-discovered.html
- https://helpx.adobe.com/stock/contributor/content-policies-guidelines/metadata/tips-effective-titles-keywords.html
- https://stock.adobe.com/pages/artisthub/pdf/2023-adobe-stock-metadata-guide.pdf
