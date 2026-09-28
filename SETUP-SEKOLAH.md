# Menjalankan HemoExplorer di Sekolah

1. Pastikan Node.js 20 atau lebih baru sudah terpasang.
2. Salin `.env.example` menjadi `.env`.
3. Ganti `TEACHER_PASSWORD`, `SESSION_SECRET`, nama guru, dan nama sekolah.
4. Jalankan `npm start`.
5. Buka `http://localhost:8080` pada komputer server.

Untuk perangkat siswa dalam jaringan sekolah, gunakan alamat IP komputer server, misalnya
`http://192.168.1.10:8080`. Izinkan port tersebut di firewall hanya untuk jaringan sekolah.

Data nilai tersimpan di `data/students.json`. Cadangkan folder `data` secara berkala dan
jangan publikasikan data tersebut ke internet.

Jalankan `npm run check` untuk memeriksa sintaks server dan JavaScript utama.

## Supabase

Isi `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` pada `.env`. Browser mengambil
keduanya melalui `/api/config` dan membuat satu client pada `window.hemoSupabase`.
Gunakan `await window.supabaseClientReady` sebelum query pertama.

Secret key dan password PostgreSQL hanya boleh berada pada `.env` server. Endpoint
`/api/config` sengaja tidak pernah mengembalikan keduanya ke browser.

## Keamanan

- Jangan gunakan `server.ps1` untuk operasional sekolah; server itu hanya untuk demo statis.
- Jangan unggah `.env` atau folder `data` ke repositori publik.
- Gunakan HTTPS jika aplikasi dibuka melalui internet.
