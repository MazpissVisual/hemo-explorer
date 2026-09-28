'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

loadEnv(path.join(__dirname, '..', '.env'));

const baseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const secretKey = process.env.SUPABASE_SECRET_KEY || '';
const email = process.env.DUMMY_TEACHER_EMAIL || 'guru.demo@example.com';
const fullName = process.env.DUMMY_TEACHER_NAME || 'Guru Demo';
const schoolName = process.env.DUMMY_SCHOOL_NAME || 'SD Demo HemoExplorer';
const schoolSlug = process.env.DUMMY_SCHOOL_SLUG || 'sd-demo-hemoexplorer';
const classroomName = process.env.DUMMY_CLASSROOM_NAME || 'Kelas VI-A';
const academicYear = process.env.DUMMY_ACADEMIC_YEAR || '2026/2027';
const password = `${crypto.randomBytes(12).toString('base64url')}Aa1!`;

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(baseUrl)) {
  throw new Error('SUPABASE_URL tidak valid.');
}
if (!secretKey.startsWith('sb_secret_')) {
  throw new Error('SUPABASE_SECRET_KEY belum valid di .env.');
}

const headers = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json'
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.msg || result.message || result.error_description || result.error || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return result;
}

async function ensureAuthUser() {
  try {
    return await request('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, app_role: 'teacher' }
      })
    });
  } catch (error) {
    if (error.status !== 422 && !/already|registered|exists/i.test(error.message)) throw error;
    const listing = await request('/auth/v1/admin/users?page=1&per_page=1000');
    const existing = (listing.users || []).find(user => String(user.email).toLowerCase() === email.toLowerCase());
    if (!existing) throw error;
    return request(`/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({ password, email_confirm: true, user_metadata: { full_name: fullName, app_role: 'teacher' } })
    });
  }
}

async function upsert(table, conflict, payload, select = '*') {
  const endpoint = `/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}&select=${encodeURIComponent(select)}`;
  const rows = await request(endpoint, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload)
  });
  return rows[0];
}

async function main() {
  const authUser = await ensureAuthUser();
  const school = await upsert('schools', 'slug', { name: schoolName, slug: schoolSlug, is_active: true }, 'id,name,slug');
  await upsert('profiles', 'id', {
    id: authUser.id,
    school_id: school.id,
    role: 'teacher',
    full_name: fullName,
    student_code: null,
    is_active: true
  }, 'id,full_name,role');
  const classroom = await upsert('classrooms', 'school_id,name,academic_year', {
    school_id: school.id,
    teacher_id: authUser.id,
    name: classroomName,
    grade: 6,
    academic_year: academicYear,
    is_active: true
  }, 'id,name,academic_year');

  process.stdout.write(JSON.stringify({
    ok: true,
    email,
    password,
    teacherId: authUser.id,
    school: school.name,
    classroom: classroom.name,
    academicYear: classroom.academic_year
  }, null, 2));
}

main().catch(error => {
  process.stderr.write(`Gagal membuat akun dummy: ${error.message}\n`);
  process.exitCode = 1;
});
