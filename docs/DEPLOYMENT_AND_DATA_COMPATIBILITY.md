# Deployment & Data Compatibility Gate

## Hasil audit baseline R10.19

| Kategori | Kondisi pada paket baseline |
|---|---|
| Firestore | Firebase SDK dan repository Firestore tidak ditemukan |
| Firebase Authentication | Tidak ditemukan; login runtime memakai akun pada data lokal/fallback |
| Firebase Storage | Tidak ditemukan |
| localStorage | Sumber data runtime utama dengan key `GE_V2_1_DATA` |
| sessionStorage | Sesi legacy `GXP_SESSION_V24`; R10.20 dibaca sebagai fallback |
| Static JavaScript | Data awal dan fallback user tersedia pada JavaScript |
| Dummy/demo data | Ada data awal/fallback; jangan dinyatakan sebagai data produksi Firestore |

Audit project Firebase produksi, collections, document IDs, Authentication users, Storage references, Rules, dan Indexes harus dilakukan terhadap project Firebase yang benar sebelum integrasi. R10.20 tidak membuat project Firebase baru dan tidak menjalankan migrasi otomatis.

## Perubahan kompatibel pada R10.20

- Sesi login disimpan lintas-tab sehingga anchor menu tetap memakai perilaku browser asli, termasuk klik kanan dan **Open link in new tab**.
- Sesi `sessionStorage` versi lama tetap dibaca lalu dimigrasikan secara additive ke penyimpanan sesi bersama.
- URL tujuan disimpan sebelum redirect login dan dibuka kembali setelah login.
- Refresh mempertahankan halaman aktif selama sesi masih tersedia.
- Logout menghapus sesi legacy dan sesi bersama.
- Tidak ada CSS, layout, font, warna, data bisnis, OCR, atau renderer Dashboard/Initiative/Calendar/Gantt yang diubah.

## Aturan integrasi Firebase

- Gunakan existing Firebase project; jangan membuat project baru.
- Pertahankan collections, document IDs, dan legacy fields.
- `assignedStations[]` fallback ke `airports[]`.
- `menuAccess[]` fallback ke `tabs[]`.
- `assignedLounges[]` fallback ke `loungeIds[]`.
- Field baru ditulis dengan `update` atau merge, bukan mengganti dokumen penuh.
- Jangan melakukan seed, reset, clear, rewrite profile, atau migration saat page load/deployment.
- Migration wajib memiliki preview, jumlah record, mapping, validasi, backup, rollback, dan persetujuan eksplisit.
- Halaman baru tanpa data menampilkan empty state dan tidak menulis dummy data.

## Deploy Preview acceptance checklist

- [ ] Terhubung ke Firebase project yang dimaksud setelah adapter Firebase disediakan.
- [ ] Existing Authentication users tetap dapat login.
- [ ] Existing Firestore documents dan IDs tidak berubah.
- [ ] Existing CSI, NPS, station, dan initiative data tampil.
- [ ] Legacy `tabs`, `airports`, dan `loungeIds` tetap didukung.
- [ ] Menu yang tidak diizinkan tidak tampil dan direct URL tetap ditolak.
- [ ] Klik kiri menu membuka halaman yang dipilih.
- [ ] Klik kanan → Open link in new tab membuka halaman yang dipilih tanpa login ulang.
- [ ] Refresh mempertahankan halaman aktif.
- [ ] Jika sesi belum ada, login kembali ke URL tujuan yang valid.
- [ ] New pages tanpa data menampilkan empty state, bukan error/dummy.
- [ ] OCR workflow tidak berubah.
- [ ] Dashboard, Initiative, Calendar, Project Tracking, dan Gantt tidak berubah secara visual.
- [ ] Tidak ada secret di GitHub.
- [ ] Deploy Preview lulus sebelum production.
- [ ] Netlify previous deploy tersedia sebagai rollback.
- [ ] Tidak ada migrasi database otomatis saat deployment.

## Rollback

Jika pemeriksaan gagal, gunakan **Deploys → pilih previous successful production deploy → Publish deploy** pada Netlify. Karena deployment ini tidak menjalankan migrasi atau penulisan data otomatis, rollback kode tidak memerlukan rollback database.
