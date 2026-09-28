# Audit autentikasi, role, dan rancangan Supabase

## Ringkasan keputusan

Arsitektur sekarang cukup untuk server lokal satu sekolah, tetapi belum aman untuk deployment internet atau banyak guru. Migrasi Supabase sebaiknya memakai:

- Supabase Auth sebagai satu-satunya sumber identitas.
- Role aplikasi `admin`, `teacher`, dan `student` pada tabel `profiles`.
- Relasi eksplisit `schools -> classrooms -> classroom_students`.
- Nilai kuis sebagai baris attempt, bukan kolom `mudah/sedang/sulit` pada profil siswa.
- PBL sebagai submission per kasus.
- RLS pada semua tabel yang terekspos.
- Service role hanya di server/Edge Function, tidak pernah di browser.

Migration awal tersedia di `supabase/migrations/202609280001_initial_school_schema.sql`.

## Alur yang berjalan sekarang

### Guru

1. Guru mengirim username dan password ke `POST /api/auth/login`.
2. Server membandingkannya dengan satu akun guru dari `.env`.
3. Server membuat session acak di `Map` memori dan memasang cookie `HttpOnly`, `SameSite=Strict` selama delapan jam.
4. Browser memverifikasi sesi melalui `GET /api/session`.
5. Endpoint daftar dan penghapusan siswa memeriksa `session.role === 'teacher'`.

### Siswa

1. Siswa memasukkan nama dan kelas tanpa password/PIN.
2. `POST /api/students/session` mencari siswa berdasarkan kombinasi nama dan kelas.
3. Jika belum ada, server membuat siswa baru; jika ada, server memakai record lama.
4. Server membuat cookie sesi siswa dan mengikatnya ke `studentId`.
5. Progres dikirim ke `POST /api/students/progress`.

### Penyimpanan

- Data server utama berada di `data/students.json`.
- Session server berada di RAM dan hilang saat proses restart.
- Browser masih menyimpan cache user, roster, kuis, dan PBL di `localStorage`.
- Dashboard mencampur data server, cache browser, dan opsi Google Sheets.

## Temuan audit

### Kritis

1. **Identitas siswa dapat diambil alih.** Siapa pun yang mengetahui nama dan kelas dapat memperoleh sesi untuk record siswa tersebut dan mengubah progresnya.
2. **Skor dapat dikirim langsung oleh klien.** Endpoint menerima angka skor dari browser. Siswa dapat memanggil endpoint sendiri dengan skor 100.
3. **Sumber data ganda.** Setelah request server, `updateStudentScore()` tetap menjalankan pembaruan cache lokal. UI dapat berbeda dengan data server ketika request gagal atau dua perangkat digunakan.

### Tinggi

4. **Hanya satu akun guru.** Kredensial guru global dari `.env` tidak mendukung audit per guru, pergantian staf, atau beberapa kelas.
5. **Session tidak persisten.** Semua user logout saat server restart dan session tidak dapat dibagi jika aplikasi memakai lebih dari satu instance.
6. **Data siswa tidak ternormalisasi.** Profil, nilai terakhir, jumlah PBL, status, dan catatan berada pada satu record sehingga riwayat attempt hilang.
7. **Race condition file JSON.** Dua request progres bersamaan dapat membaca state lama dan saling menimpa.

### Sedang

8. Cookie produksi belum menggunakan atribut `Secure`.
9. Rate limit login hanya berada di RAM dan berdasarkan alamat IP; restart menghapus limit dan jaringan sekolah dapat membuat banyak user berbagi satu IP.
10. `localStorage` dianggap sebagai cache identitas walaupun akses sebenarnya ditentukan cookie. Ini dapat menampilkan UI user lama sesaat sebelum verifikasi selesai.
11. Penghapusan siswa bersifat permanen dan belum memiliki audit trail atau soft delete.
12. Nama siswa muncul pada data pendidikan. Tetapkan retensi data, persetujuan sekolah/orang tua, dan pembatasan ekspor sebelum deployment publik.

## Model login yang disarankan

### Guru dan admin

- Gunakan Supabase Auth email/password.
- Admin sekolah mengundang guru; jangan sediakan registrasi guru publik.
- Setelah login, role dibaca dari `profiles.role`; UI tidak pernah menjadi sumber otorisasi.
- Akses dashboard ditentukan lagi oleh RLS.

### Siswa

Pilihan yang disarankan untuk siswa SD adalah **kode siswa + PIN**, bukan nama + kelas.

1. Guru membuat/import siswa dan sistem menghasilkan `student_code` acak.
2. PIN awal diberikan secara privat dan wajib diganti bila kebijakan sekolah mengharuskan.
3. Login kode+PIN diproses oleh server/Edge Function, bukan query tabel profil dari browser.
4. Server/Edge Function memverifikasi PIN yang sudah di-hash dan mengembalikan session Supabase.

Alternatif paling sederhana adalah akun Auth per siswa yang diprovisikan guru. Hindari registrasi publik dan hindari menjadikan nama sebagai credential.

## Struktur data target

```text
auth.users
   │ 1:1
profiles ──> schools
   │
   ├── teacher_id ──> classrooms
   │                    │
   │                    └── classroom_students <── student profile
   │
   ├── quiz_attempts
   ├── pbl_submissions
   └── learning_events
```

`quiz_attempts` menyimpan semua percobaan sehingga nilai terbaik, terakhir, jumlah percobaan, dan perkembangan waktu dapat dihitung tanpa kehilangan riwayat.

## Aturan akses target

| Data | Siswa | Guru kelas | Admin sekolah |
|---|---|---|---|
| Profil sendiri | baca, ubah field aman | baca siswa kelas | baca sekolah |
| Kelas | baca kelasnya | CRUD kelas sendiri | CRUD sekolah |
| Keanggotaan kelas | baca milik sendiri | kelola kelas sendiri | kelola sekolah |
| Attempt kuis | buat dan baca sendiri | baca kelas | baca sekolah |
| Submission PBL | buat/baca sendiri | baca dan review kelas | baca sekolah |
| Hapus akun | tidak | soft-disable siswa | melalui server admin |

## Tahapan migrasi

1. Buat project Supabase terpisah untuk development.
2. Jalankan migration SQL dan uji seluruh policy allow/deny.
3. Import sekolah, kelas, guru, dan siswa; simpan mapping UUID lama ke UUID baru.
4. Ganti login guru terlebih dahulu dengan Supabase Auth.
5. Implementasikan provisioning serta login kode+PIN siswa.
6. Ubah penyimpanan kuis/PBL menjadi insert ke attempt/submission.
7. Jadikan `localStorage` hanya untuk preferensi UI dan antrean offline, bukan sumber nilai resmi.
8. Migrasikan isi `students.json`, lalu lakukan rekonsiliasi jumlah siswa dan nilai.
9. Nonaktifkan endpoint file JSON dan integrasi Google Sheets langsung dari browser.
10. Tambahkan pengujian RLS sebelum produksi.

## Catatan implementasi

- Publishable/anon key boleh berada di browser; keamanan tetap harus berasal dari grants dan RLS.
- `service_role` melewati RLS dan hanya boleh disimpan pada server atau Edge Function.
- Fungsi `security definer` harus memakai `set search_path = ''`, referensi schema lengkap, dan hak execute terbatas.
- Jangan mempercayai `student_id`, role, school, atau skor yang dikirim browser tanpa validasi server/database.
- Untuk nilai yang penting, kirim jawaban atau event yang dapat diverifikasi dan hitung skor di server/RPC.

