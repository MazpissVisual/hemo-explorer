'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Untuk Vercel Serverless, kita gunakan /tmp karena read-only file system
const DATA_DIR = '/tmp';
const DATA_FILE = path.join(DATA_DIR, 'students.json');

const teacher = {
  username: process.env.TEACHER_USERNAME || 'guru',
  password: process.env.TEACHER_PASSWORD || '',
  name: process.env.TEACHER_NAME || 'Guru IPA Kelas VI',
  school: process.env.SCHOOL_NAME || 'Sekolah'
};
const secret = process.env.SESSION_SECRET || 'fallback-secret-for-vercel-deployments-32-chars';
const sessions = new Map();
const loginAttempts = new Map();

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]\n', 'utf8');

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'Content-Length': data.length,
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY'
  });
  res.end(data);
}

async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('Payload terlalu besar');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function clean(value, max = 100) {
  return String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}

function readStudents() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; }
}

function writeStudents(rows) {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, DATA_FILE);
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const i = part.indexOf('='); return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))];
  }));
}

function currentSession(req) {
  const session = sessions.get(cookies(req).hemo_session);
  if (!session || session.expires < Date.now()) return null;
  return session;
}

function newSession(res, value) {
  const id = crypto.randomBytes(32).toString('base64url');
  sessions.set(id, { ...value, expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', `hemo_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
}

function safeEqual(a, b) {
  const ah = crypto.scryptSync(a, secret, 64);
  const bh = crypto.scryptSync(b, secret, 64);
  return crypto.timingSafeEqual(ah, bh);
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const session = currentSession(req);
    
    if (req.method === 'GET' && url.pathname === '/api/config') {
      const supabaseUrl = clean(process.env.SUPABASE_URL, 250);
      const supabasePublishableKey = clean(process.env.SUPABASE_PUBLISHABLE_KEY, 250);
      const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
        && supabasePublishableKey.startsWith('sb_publishable_');
      return json(res, 200, {
        supabase: configured ? { url: supabaseUrl, publishableKey: supabasePublishableKey } : null,
        configured
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/session') {
      return json(res, 200, { user: session ? session.public : null });
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const clientKey = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const attempt = loginAttempts.get(clientKey) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
      if (attempt.resetAt < Date.now()) { attempt.count = 0; attempt.resetAt = Date.now() + 15 * 60 * 1000; }
      if (attempt.count >= 5) return json(res, 429, { error: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' });
      const input = await body(req);
      if (!safeEqual(clean(input.username, 50).toLowerCase(), teacher.username.toLowerCase()) || !safeEqual(String(input.password || ''), teacher.password)) {
        attempt.count += 1; loginAttempts.set(clientKey, attempt);
        return json(res, 401, { error: 'Username atau password guru salah.' });
      }
      loginAttempts.delete(clientKey);
      const publicUser = { username: teacher.username, name: teacher.name, role: 'Guru Pengajar', school: teacher.school, loginTime: new Date().toISOString() };
      newSession(res, { role: 'teacher', public: publicUser });
      return json(res, 200, { user: publicUser });
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      sessions.delete(cookies(req).hemo_session);
      res.setHeader('Set-Cookie', 'hemo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/students/session') {
      const input = await body(req);
      const name = clean(input.name, 80);
      const className = clean(input.className, 30);
      if (name.length < 2 || !/^Kelas VI-[A-Z]$/.test(className)) return json(res, 400, { error: 'Nama atau kelas tidak valid.' });
      const rows = readStudents();
      let student = rows.find(s => s.name.toLowerCase() === name.toLowerCase() && s.className === className);
      const now = new Date().toISOString();
      if (!student) {
        student = { id: crypto.randomUUID(), name, className, avatar: clean(input.avatar, 8) || '🎒', mudah: '-', sedang: '-', sulit: '-', pbl: '0 Kasus', pblScore: 0, status: 'Baru Masuk', notes: '', joinedAt: now };
        rows.unshift(student);
      }
      student.lastActive = now; student.loginTime = now;
      writeStudents(rows);
      const publicStudent = { id: student.id, name, className, avatar: student.avatar, loginTime: now };
      newSession(res, { role: 'student', studentId: student.id, public: publicStudent });
      return json(res, 200, { student: publicStudent });
    }
    if (req.method === 'GET' && url.pathname === '/api/students') {
      if (!session || session.role !== 'teacher') return json(res, 403, { error: 'Akses khusus guru.' });
      return json(res, 200, { students: readStudents() });
    }
    if (req.method === 'POST' && url.pathname === '/api/students/progress') {
      if (!session || session.role !== 'student') return json(res, 401, { error: 'Sesi siswa telah berakhir.' });
      const input = await body(req); const rows = readStudents();
      const student = rows.find(s => s.id === session.studentId);
      if (!student) return json(res, 404, { error: 'Data siswa tidak ditemukan.' });
      const levelMap = { kecil: 'mudah', mudah: 'mudah', besar: 'sedang', sedang: 'sedang', gabungan: 'sulit', sulit: 'sulit' };
      if (input.level in levelMap && Number.isFinite(Number(input.score))) student[levelMap[input.level]] = Math.max(0, Math.min(100, Number(input.score)));
      if (Number.isFinite(Number(input.pblScore))) student.pblScore = Math.max(0, Math.min(100, Number(input.pblScore)));
      if (input.pblCount !== undefined) student.pbl = `${Math.max(0, Math.min(20, Number(input.pblCount) || 0))} Kasus Tuntas`;
      if (input.pblRefleksi) student.notes = clean(input.pblRefleksi, 500);
      student.lastActive = new Date().toISOString(); writeStudents(rows);
      return json(res, 200, { student });
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/students/')) {
      if (!session || session.role !== 'teacher') return json(res, 403, { error: 'Akses khusus guru.' });
      const id = decodeURIComponent(url.pathname.slice('/api/students/'.length));
      writeStudents(readStudents().filter(s => s.id !== id));
      return json(res, 200, { ok: true });
    }
    
    return json(res, 404, { error: 'Endpoint tidak ditemukan.' });
  } catch (error) { 
    return json(res, error.message === 'Payload terlalu besar' ? 413 : 400, { error: error.message || 'Permintaan tidak valid.' }); 
  }
};
