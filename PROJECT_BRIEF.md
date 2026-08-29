# Adobe Stock Auto Metadata App — Project Brief

## Tujuan
Web app untuk auto-generate metadata foto sesuai standar Adobe Stock.
User upload foto, AI analisis gambar, lalu generate title + keywords secara otomatis.

---

## Fitur Utama

1. **Upload Foto**
   - Drag & drop atau klik untuk upload
   - Support multiple files sekaligus

2. **Auto-Generate Metadata via AI (Gemini Vision)**
   - Analisis gambar dengan Google Gemini 1.5 Flash (free tier)
   - Generate: Title, Keywords, Category

3. **Edit Metadata Manual**
   - Edit title, keywords, category secara manual
   - Tambah / hapus / drag-reorder keywords

4. **Smart Keyword Reorder saat Title Berubah**
   - Saat title diedit, sistem re-rank 10 keyword pertama
   - Berdasarkan kedekatan/relevansi dengan title baru
   - Keywords yang ada TIDAK berubah, TIDAK ditambah, TIDAK dihapus
   - Hanya URUTAN yang berubah, terutama 10 keyword pertama

5. **Export CSV**
   - Format CSV untuk bulk upload ke Adobe Stock Contributor Portal

---

## Aturan Metadata Adobe Stock

### Title
- Ideal 70 karakter, max 200
- Natural language, deskriptif
- Setiap title unik per foto
- Keyword paling relevan harus muncul di title DAN top 10 keywords
- Hindari: brand name, nama orang, istilah teknis kamera

#### Title harus menjawab:
- **Who?** — Gender, Age, Ethnicity, Role
- **Where?** — Indoors/outdoors, lokasi spesifik
- **Who are they with?** — Jumlah orang, hubungan/role
- **What?** — Aktivitas yang dilakukan
- **When?** — Waktu (morning, night, dll)
- **Mood?** — Positive, excited, anxious, dll
- **Clothing?** — Pakaian notable
- **Concept?** — Fitness, healthcare, dll

### Keywords
- Maks 49 keywords per foto
- Optimal: **15–35 keywords**
- **10 keyword pertama paling penting** — paling berpengaruh di search ranking
- Bahasa: **English**
- Format: **single word** untuk semua keyword biasa
  - ✅ `beach`, `woman`, `sunset`, `running`
  - ✅ Multi-word HANYA untuk proper noun / compound noun yang tidak bisa dipisah
    - Contoh: `golden retriever`, `Golden Gate Bridge`, `Eiffel Tower`
  - ❌ `senior woman` → pisah jadi `senior` + `woman`
  - ❌ `one person` → `solo` atau `alone`
- Hindari: brand names, sinonim berlebihan, keyword spam
- Tipe keyword yang di-cover:
  - Subject & action
  - Setting (indoors, outdoors, day, night)
  - Mood & concept
  - Demographics (ethnicity, age, gender)
  - Camera angle / viewpoint
  - Location

---

## Tech Stack
- **Frontend:** React
- **Backend:** Node.js + Express
- **AI Vision:** Google Gemini 1.5 Flash (free tier)
  - 15 req/menit, 1.500 req/hari
- **Export:** CSV
- **Deploy:** Vercel

---

## Referensi
- https://helpx.adobe.com/stock/contributor/help/artist-hub-migration/maximize-metadata-to-get-discovered.html
- https://helpx.adobe.com/stock/contributor/content-policies-guidelines/metadata/tips-effective-titles-keywords.html
- https://stock.adobe.com/pages/artisthub/pdf/2023-adobe-stock-metadata-guide.pdf
