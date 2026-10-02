# Catatan Revisi R10.20

Baseline tunggal: `Ground_Experience_Garuda_Indonesia_R10_19_OCR_CORRECTION_WORKFLOW`.

## Dikerjakan pada revisi ini

- Mempertahankan menu sebagai anchor HTML native agar klik kanan dan **Open link in new tab** tersedia dari browser.
- Membagikan sesi login antar-tab pada origin portal yang sama.
- Mempertahankan kompatibilitas pembacaan sesi `sessionStorage` versi sebelumnya.
- Menyimpan URL halaman tujuan sebelum diarahkan ke login.
- Mengembalikan pengguna ke halaman tujuan setelah login berhasil.
- Mempertahankan halaman aktif ketika browser di-refresh.
- Menambahkan konfigurasi production, Deploy Preview, branch deploy, dan Functions pada Netlify.
- Menambahkan dokumentasi GitHub, Netlify, environment variables, audit data, acceptance test, dan rollback.

## Dikunci dan tidak diubah

- Tampilan Dashboard.
- Tampilan Initiative.
- Tampilan Calendar, Project Tracking, dan Gantt, termasuk font, tinggi huruf, warna, spacing, dan komponennya.
- OCR Correction Workflow.
- Data bisnis, struktur koleksi, document IDs, dan legacy fields.
- Tidak ada seed, reset, migrasi, atau penulisan dummy otomatis.

## Catatan integrasi

Paket baseline tidak berisi runtime Firebase SDK/Firestore. Integrasi ke existing Firebase project harus dilakukan setelah konfigurasi dan implementasi website online yang benar tersedia untuk diaudit. Jangan menganggap data `localStorage` sebagai data Firestore produksi.
