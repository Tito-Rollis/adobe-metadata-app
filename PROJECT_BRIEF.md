# Adobe Stock Auto Metadata App — Project Brief

## Tujuan
Web app untuk auto-generate metadata foto sesuai standar Adobe Stock.
User upload foto, AI analisis gambar, lalu generate title + keywords secara otomatis.

---

## Fitur Utama

1. **Upload Foto**
   - Drag & drop atau klik untuk upload
   - Support multiple files sekaligus

2. **Auto-Generate Metadata via AI (Vision)**
   - Analisis gambar dengan AI
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

## Aturan Metadata Adobe Stock (dari panduan resmi)

### Title
- Ideal 70 karakter, max 200
- Natural language, deskriptif
- Setiap title unik per foto
- Keyword paling relevan harus muncul di title DAN top 10 keywords
- Hindari: brand name, nama orang, istilah teknis kamera

#### Title harus menjawab:
- **Who?** — Gender, Age, Ethnicity, Role (dari model release)
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
- Keyword individual (bukan frasa) → "red", "dress" bukan "red dress"
- Sertakan: subject, action, setting, mood/concept, demographics, camera angle
- Hindari: brand names, sinonim berlebihan, keyword spam (tidak relevan)
- Jangan duplikasi sinonim (misal: dog, dogs, canine — cukup "dog")

#### Tipe keyword yang perlu di-cover:
- Separate descriptive elements (White, fluffy, young)
- General & specific (Animal, mammal → golden retriever)
- Location-based (London, England)
- Conceptual (Solitude, childhood, milestone)
- Number of people (One person, three people)
- Setting (Indoors, outdoors, day, night)
- Viewpoint/angle (Aerial view, portrait, high-angle)
- Model info (Black woman, senior man, Latinx teen)

---

## Tech Stack (Rencana)
- **Frontend:** React
- **Backend:** Node.js + Express
- **AI Vision:** *(belum ditentukan — OpenAI GPT-4 Vision atau Google Gemini Vision)*
- **Export:** CSV

---

## Pertanyaan yang Belum Dijawab (perlu konfirmasi sebelum build)

1. **AI Vision** — mau pakai OpenAI GPT-4 Vision atau Google Gemini Vision?
   - Sudah punya API key salah satunya?
2. **Export** — CSV saja, atau perlu embed langsung ke EXIF/IPTC metadata file foto?
3. **Bahasa metadata** — English (standar Adobe Stock)?
4. **Deploy** — cukup local/localhost, atau perlu di-deploy ke server?

---

## Referensi
- https://helpx.adobe.com/stock/contributor/help/artist-hub-migration/maximize-metadata-to-get-discovered.html
- https://helpx.adobe.com/stock/contributor/content-policies-guidelines/metadata/tips-effective-titles-keywords.html
- https://stock.adobe.com/pages/artisthub/pdf/2023-adobe-stock-metadata-guide.pdf
