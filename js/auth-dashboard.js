/**
 * AUTHENTICATION & DASHBOARD CONTROLLER - HEMOEXPLORER
 * Login guru menggunakan Supabase Auth; sesi siswa lama tetap dilayani server sekolah.
 */

class AuthManager {
  constructor() {
    this.storageKey = 'hemoexplorer_auth_user';
    this.studentStorageKey = 'hemoexplorer_student_session';
    this.sessionVerified = false;
    
    this.currentUser = this.loadUser();
    this.currentStudent = this.loadStudent();
    this.restoreSession();
  }

  // --- 1. MANAJEMEN DATA GURU ---
  loadUser() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return this.currentUser !== null && this.sessionVerified;
  }

  async api(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin', ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Server tidak dapat memproses permintaan.');
    return result;
  }

  async getSupabase() {
    if (!window.supabaseClientReady) {
      throw new Error('Koneksi Supabase belum tersedia. Muat ulang halaman lalu coba lagi.');
    }
    const client = await window.supabaseClientReady;
    if (!client) throw new Error('Supabase belum dikonfigurasi pada server.');
    return client;
  }

  async getTeacherFromSession(session) {
    const client = await this.getSupabase();
    const { data: profile, error } = await client
      .from('profiles')
      .select('id, school_id, role, full_name, is_active')
      .eq('id', session.user.id)
      .single();

    if (error) throw new Error('Profil guru tidak dapat dibaca: ' + error.message);
    if (!profile.is_active || !['teacher', 'admin'].includes(profile.role)) {
      throw new Error('Akun ini tidak memiliki akses sebagai guru.');
    }

    let schoolName = 'Sekolah';
    const { data: school } = await client
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .maybeSingle();
    if (school?.name) schoolName = school.name;

    return {
      id: profile.id,
      username: session.user.email,
      email: session.user.email,
      name: profile.full_name,
      avatar: 'GR',
      role: 'Guru Pengajar',
      appRole: profile.role,
      school: schoolName,
      schoolId: profile.school_id,
      loginTime: new Date().toISOString()
    };
  }

  async loadTeacherRoster() {
    const client = await this.getSupabase();
    const { data: classrooms, error: classroomError } = await client
      .from('classrooms')
      .select('id, name')
      .eq('teacher_id', this.currentUser.id)
      .eq('is_active', true);
    if (classroomError) throw classroomError;

    const classroomIds = (classrooms || []).map(item => item.id);
    if (!classroomIds.length) {
      this.saveRoster([]);
      return [];
    }

    const { data: memberships, error: membershipError } = await client
      .from('classroom_students')
      .select('student_id, classroom_id, enrolled_at')
      .in('classroom_id', classroomIds)
      .eq('is_active', true);
    if (membershipError) throw membershipError;

    const studentIds = [...new Set((memberships || []).map(item => item.student_id))];
    if (!studentIds.length) {
      this.saveRoster([]);
      return [];
    }

    const [profilesResult, quizResult, pblResult] = await Promise.all([
      client.from('profiles').select('id, full_name, student_code, avatar_key, created_at, updated_at').in('id', studentIds),
      client.from('quiz_attempts').select('student_id, level, score, completed_at').in('student_id', studentIds).order('completed_at', { ascending: false }),
      client.from('pbl_submissions').select('student_id, score, status, reflection, updated_at').in('student_id', studentIds).order('updated_at', { ascending: false })
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (quizResult.error) throw quizResult.error;
    if (pblResult.error) throw pblResult.error;

    const classNames = new Map((classrooms || []).map(item => [item.id, item.name]));
    const memberByStudent = new Map((memberships || []).map(item => [item.student_id, item]));
    const roster = (profilesResult.data || []).map((profile, index) => {
      const attempts = (quizResult.data || []).filter(item => item.student_id === profile.id);
      const submissions = (pblResult.data || []).filter(item => item.student_id === profile.id);
      const scoreFor = level => attempts.find(item => item.level === level)?.score ?? '-';
      const numericScores = ['mudah', 'sedang', 'sulit'].map(scoreFor).filter(Number.isFinite);
      const average = numericScores.length
        ? Math.round(numericScores.reduce((total, score) => total + score, 0) / numericScores.length)
        : null;
      const completedPbl = submissions.filter(item => item.status !== 'draft');
      const latestPblScore = submissions.find(item => Number.isFinite(item.score))?.score ?? '-';
      const membership = memberByStudent.get(profile.id);

      return {
        id: profile.id,
        studentCode: profile.student_code,
        name: profile.full_name,
        className: classNames.get(membership?.classroom_id) || 'Belum ada kelas',
        avatar: profile.avatar_key || (index % 2 ? 'SW' : 'SD'),
        mudah: scoreFor('mudah'),
        sedang: scoreFor('sedang'),
        sulit: scoreFor('sulit'),
        pbl: `${completedPbl.length} Kasus Tuntas`,
        pblScore: latestPblScore,
        status: average === null ? 'Belum Mulai' : average >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
        notes: submissions[0]?.reflection || 'Belum ada catatan pembelajaran.',
        joinedAt: membership?.enrolled_at || profile.created_at,
        lastActive: attempts[0]?.completed_at || submissions[0]?.updated_at || profile.updated_at
      };
    });

    this.saveRoster(roster);
    return roster;
  }

  async restoreSession() {
    try {
      const client = await this.getSupabase();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        this.currentUser = await this.getTeacherFromSession(data.session);
        this.sessionVerified = true;
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        this.updateUI();
        return;
      }

      this.currentUser = null;
      this.sessionVerified = false;
      localStorage.removeItem(this.storageKey);

      // Sesi siswa masih memakai cookie server lokal sampai migrasi siswa selesai.
      const { user } = await this.api('/api/session').catch(() => ({ user: null }));
      if (user && user.role !== 'Guru Pengajar') {
        this.currentStudent = user;
        localStorage.setItem(this.studentStorageKey, JSON.stringify(user));
      }
      this.updateUI();
    } catch (error) {
      this.currentUser = null;
      this.sessionVerified = false;
      localStorage.removeItem(this.storageKey);
      this.updateUI();
      console.error('Gagal memulihkan sesi guru:', error);
    }
  }

  async login(email, password) {
    try {
      const client = await this.getSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      const user = await this.getTeacherFromSession(data.session);
      this.currentUser = user;
      this.sessionVerified = true;
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      this.updateUI();
      if (window.audioMgr) window.audioMgr.playCorrectSound();
      this.closeLoginModal();
      if (window.navigateTo) window.navigateTo('view-dashboard');
      if (window.dashboardMgr) {
        await window.dashboardMgr.refreshRoster(false);
        window.dashboardMgr.renderDashboard();
      }
      this.showToast('Login guru berhasil. Selamat datang, ' + user.name, 'success');
      return { success: true };
    } catch (error) {
      try {
        const client = await this.getSupabase();
        await client.auth.signOut();
      } catch (_) {}
      if (window.audioMgr) window.audioMgr.playWrongSound();
      const message = /invalid login credentials/i.test(error.message)
        ? 'Email atau password guru salah.'
        : error.message;
      return { success: false, message };
    }
  }

  async logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari Akun Guru?')) {
      try {
        const client = await this.getSupabase();
        await client.auth.signOut();
      } catch (_) {}
      await this.api('/api/auth/logout', { method: 'POST' }).catch(() => {});
      if (window.audioMgr) window.audioMgr.playClickSound();
      this.currentUser = null;
      this.sessionVerified = false;
      localStorage.removeItem(this.storageKey);
      this.updateUI();

      if (window.navigateTo) {
        window.navigateTo('view-portal');
      }

      this.showToast('👋 Anda telah keluar dari Akun Guru.', 'info');
    }
  }

  async logoutStudent() {
    if (confirm('Apakah Anda ingin keluar / mengganti sesi siswa?')) {
      await this.api('/api/auth/logout', { method: 'POST' }).catch(() => {});
      if (window.audioMgr) window.audioMgr.playClickSound();
      this.currentStudent = null;
      localStorage.removeItem(this.studentStorageKey);
      this.updateUI();

      if (window.navigateTo) {
        window.navigateTo('view-portal');
      }

      this.showToast('👋 Sesi siswa telah diakhiri.', 'info');
    }
  }

  openLoginModal(redirectMessage = null) {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const modal = document.getElementById('auth-login-modal');
    const msgEl = document.getElementById('auth-modal-redirect-msg');
    const errorEl = document.getElementById('auth-error-msg');
    
    if (errorEl) errorEl.style.display = 'none';

    if (msgEl) {
      if (redirectMessage) {
        msgEl.textContent = redirectMessage;
        msgEl.style.display = 'block';
      } else {
        msgEl.style.display = 'none';
      }
    }

    if (modal) {
      modal.style.display = 'flex';
      const userInput = document.getElementById('auth-input-username');
      if (userInput) userInput.focus();
    }
  }

  closeLoginModal() {
    const modal = document.getElementById('auth-login-modal');
    if (modal) modal.style.display = 'none';
  }

  fillDemoCredentials() {
    this.showToast('Gunakan akun guru yang diberikan administrator sekolah.', 'info');
  }

  togglePasswordVisibility() {
    const passInput = document.getElementById('auth-input-password');
    const toggleBtn = document.getElementById('auth-toggle-pass-btn');
    if (!passInput) return;

    if (passInput.type === 'password') {
      passInput.type = 'text';
      if (toggleBtn) toggleBtn.textContent = '🙈';
    } else {
      passInput.type = 'password';
      if (toggleBtn) toggleBtn.textContent = '👁️';
    }
  }

  async loginAsTeacherFromPortal() {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const userInput = document.getElementById('portal-teacher-username');
    const passInput = document.getElementById('portal-teacher-password');

    const username = userInput ? userInput.value : '';
    const password = passInput ? passInput.value : '';

    const res = await this.login(username, password);
    if (!res.success) {
      alert(res.message);
      if (passInput) passInput.focus();
    }
  }

  async loginAsStudentFromPortal() {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const nameInput = document.getElementById('portal-student-name');
    const classInput = document.getElementById('portal-student-class');
    const avatarInput = document.getElementById('portal-student-avatar');

    const name = nameInput ? nameInput.value : '';
    const className = classInput ? classInput.value : 'Kelas VI-A';
    const avatar = avatarInput ? avatarInput.value : '🎒';

    if (!name || !name.trim()) {
      alert('Silakan masukkan nama lengkap siswa terlebih dahulu!');
      if (nameInput) nameInput.focus();
      return;
    }

    const saved = await this.saveStudent(name, className, avatar);
    if (!saved) return;

    if (window.navigateTo) {
      window.navigateTo('view-beranda');
    }
  }

  fillPortalTeacherDemo() {
    this.showToast('Gunakan akun guru yang diberikan administrator sekolah.', 'info');
  }

  togglePortalPasswordVisibility() {
    const passInput = document.getElementById('portal-teacher-password');
    if (!passInput) return;
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  }

  handleAuthButtonClick() {
    if (this.isLoggedIn()) {
      if (window.navigateTo) window.navigateTo('view-dashboard');
    } else {
      if (window.navigateTo) window.navigateTo('view-portal');
      else this.openLoginModal();
    }
  }

  // --- 2. MANAJEMEN DATA SISWA (PENDAFTARAN & REKAPITULASI PENILAIAN) ---
  getDefaultRoster() {
    return [];
    /* Data contoh lama tidak dipakai pada versi sekolah.
    return [
      { id: 'SIS-01', name: 'Meisya Ranny', className: 'Kelas VI-A', avatar: '👩‍🎓', mudah: 100, sedang: 100, sulit: 90, pbl: '3 Kasus Tuntas', pblScore: 100, status: 'Sangat Memuaskan', notes: 'Pemahaman anatomi jantung & sirkulasi sangat tinggi', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 3600000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-02', name: 'Ahmad Fauzan', className: 'Kelas VI-A', avatar: '👦', mudah: 90, sedang: 80, sulit: 70, pbl: '2 Kasus Tuntas', pblScore: 85, status: 'Tuntas', notes: 'Perlu latihan rute peredaran darah besar', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 7200000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-03', name: 'Siti Rahmawati', className: 'Kelas VI-A', avatar: '👧', mudah: 100, sedang: 90, sulit: 80, pbl: '3 Kasus Tuntas', pblScore: 95, status: 'Sangat Memuaskan', notes: 'Sangat aktif pada simulasi mikroskop virtual', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 10800000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-04', name: 'Budi Santoso', className: 'Kelas VI-A', avatar: '👦', mudah: 80, sedang: 70, sulit: 60, pbl: '2 Kasus Tuntas', pblScore: 75, status: 'Tuntas', notes: 'Mampu menjelaskan fungsi hemoglobin dengan baik', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 14400000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-05', name: 'Cantika Putri', className: 'Kelas VI-A', avatar: '👧', mudah: 100, sedang: 100, sulit: 100, pbl: '3 Kasus Tuntas', pblScore: 100, status: 'Sempurna ⭐', notes: 'Skor sempurna di semua kuis dan asesmen PBL', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 18000000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-06', name: 'Dewi Lestari', className: 'Kelas VI-A', avatar: '👧', mudah: 90, sedang: 80, sulit: 70, pbl: '3 Kasus Tuntas', pblScore: 90, status: 'Tuntas', notes: 'Refleksi studi kasus anemia sangat mendalam', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 21600000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-07', name: 'Farhan Pratama', className: 'Kelas VI-B', avatar: '👦', mudah: 70, sedang: 60, sulit: 50, pbl: '1 Kasus Tuntas', pblScore: 65, status: 'Perlu Bimbingan', notes: 'Perlu remedial perbedaan arteri dan vena', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 25200000).toISOString(), lastActive: new Date().toISOString() },
      { id: 'SIS-08', name: 'Gita Anggraini', className: 'Kelas VI-B', avatar: '👧', mudah: 90, sedang: 90, sulit: 80, pbl: '3 Kasus Tuntas', pblScore: 90, status: 'Tuntas', notes: 'Kalkulator denyut nadi diuji dengan baik', joinedAt: new Date().toISOString(), loginTime: new Date(Date.now() - 28800000).toISOString(), lastActive: new Date().toISOString() }
    ]; */
  }

  getRoster() {
    try {
      const data = localStorage.getItem('hemoexplorer_students_roster');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const initial = this.getDefaultRoster();
      localStorage.setItem('hemoexplorer_students_roster', JSON.stringify(initial));
      return initial;
    } catch (e) {
      return this.getDefaultRoster();
    }
  }

  saveRoster(roster) {
    try {
      localStorage.setItem('hemoexplorer_students_roster', JSON.stringify(roster));
    } catch (e) {}
  }

  loadStudent() {
    try {
      const data = localStorage.getItem(this.studentStorageKey);
      if (data) {
        const student = JSON.parse(data);
        if (window.quizEngine) {
          window.quizEngine.studentName = student.name;
        }
        return student;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async saveStudent(name, className, avatar = '🎒') {
    if (!name || !name.trim()) return false;
    const cleanName = name.trim();
    const cleanClass = (className || 'Kelas VI-A').trim();
    const nowIso = new Date().toISOString();

    try {
      const { student } = await this.api('/api/students/session', {
        method: 'POST', body: JSON.stringify({ name: cleanName, className: cleanClass, avatar })
      });
      this.currentStudent = student;
      localStorage.setItem(this.studentStorageKey, JSON.stringify(student));
      if (window.quizEngine) window.quizEngine.studentName = student.name;
      this.updateUI();
      this.closeStudentModal();
      if (window.audioMgr) window.audioMgr.playCorrectSound();
      this.showToast(`Selamat datang, ${student.name} (${student.className})!`, 'success');
      return true;
    } catch (error) {
      this.showToast(error.message, 'error');
      return false;
    }

    /* Kode penyimpanan lokal lama (tidak dijalankan; dipertahankan untuk migrasi data).

    const roster = this.getRoster();
    let student = roster.find(s => s.name.toLowerCase() === cleanName.toLowerCase());

    if (student) {
      // Perbarui info siswa jika sudah terdaftar
      student.className = cleanClass;
      if (avatar) student.avatar = avatar;
      student.loginTime = nowIso;
      student.lastActive = nowIso;
      // Geser siswa aktif ke urutan paling atas
      roster.splice(roster.indexOf(student), 1);
      roster.unshift(student);
    } else {
      // Daftarkan sebagai siswa baru di Buku Nilai Guru
      const nextNum = roster.length + 1;
      const nextId = `SIS-${String(nextNum).padStart(2, '0')}`;
      student = {
        id: nextId,
        name: cleanName,
        className: cleanClass,
        avatar: avatar || '🎒',
        mudah: '-',
        sedang: '-',
        sulit: '-',
        pbl: '0 Kasus',
        pblScore: 0,
        status: '🟢 Baru Login (Belum Mengerjakan)',
        notes: 'Siswa baru login ke sistem',
        joinedAt: nowIso,
        loginTime: nowIso,
        lastActive: nowIso
      };
      roster.unshift(student);
    }

    this.saveRoster(roster);

    const sessionStudent = {
      id: student.id,
      name: student.name,
      className: student.className,
      avatar: student.avatar || '🎒',
      loginTime: student.loginTime,
      joinedAt: student.joinedAt || nowIso
    };

    this.currentStudent = sessionStudent;
    localStorage.setItem(this.studentStorageKey, JSON.stringify(sessionStudent));

    if (window.quizEngine) {
      window.quizEngine.studentName = sessionStudent.name;
    }

    this.updateUI();
    this.closeStudentModal();

    if (window.updateDashboardStats) window.updateDashboardStats();
    if (window.dashboardMgr) window.dashboardMgr.renderDashboard();

    if (window.audioMgr) window.audioMgr.playCorrectSound();
    this.showToast(`✨ Selamat datang, ${sessionStudent.name} (${sessionStudent.className})! Data penilaianmu telah terhubung ke Buku Nilai Guru.`, 'success');
    return true; */
  }

  // Rekam update nilai asesmen siswa ke Buku Nilai terpusat
  updateStudentScore(studentNameOrId, updates = {}) {
    this.api('/api/students/progress', {
      method: 'POST', body: JSON.stringify(updates)
    }).then(({ student }) => {
      const cache = this.getRoster().filter(item => item.id !== student.id);
      cache.unshift(student);
      this.saveRoster(cache);
    }).catch(error => this.showToast(error.message, 'error'));
    try {
      const roster = this.getRoster();
      let targetName = (studentNameOrId || (this.currentStudent ? this.currentStudent.name : 'Meisya Ranny')).trim();
      let student = roster.find(s => s.name.toLowerCase() === targetName.toLowerCase() || s.id === studentNameOrId);

      if (!student) {
        const nextId = `SIS-${String(roster.length + 1).padStart(2, '0')}`;
        student = {
          id: nextId,
          name: targetName,
          className: this.currentStudent ? this.currentStudent.className : 'Kelas VI-A',
          mudah: '-',
          sedang: '-',
          sulit: '-',
          pbl: '0 Kasus',
          pblScore: 0,
          status: 'Sedang Belajar ⏳',
          notes: 'Mengerjakan asesmen mandiri',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        roster.unshift(student);
      }

      // 1. Update Kuis Berdasarkan Level
      if (updates.level !== undefined && updates.score !== undefined) {
        const levelMap = {
          'mudah': 'mudah',
          'kecil': 'mudah',
          'sedang': 'sedang',
          'besar': 'sedang',
          'sulit': 'sulit',
          'gabungan': 'sulit'
        };
        const mappedLevel = levelMap[updates.level] || 'mudah';
        student[mappedLevel] = Number(updates.score);
      }

      // 2. Update PBL
      if (updates.pblCount !== undefined || updates.pbl !== undefined) {
        const count = updates.pblCount !== undefined ? updates.pblCount : (parseInt(updates.pbl) || 1);
        student.pbl = `${count} Kasus Tuntas`;
      }
      if (updates.pblScore !== undefined) {
        student.pblScore = Number(updates.pblScore);
      }
      if (updates.pblRefleksi && updates.pblRefleksi.trim()) {
        student.notes = `Refleksi: "${updates.pblRefleksi.trim()}"`;
      }

      // 3. Kalkulasi Otomatis Status Kelulusan
      const scores = [];
      if (typeof student.mudah === 'number') scores.push(student.mudah);
      if (typeof student.sedang === 'number') scores.push(student.sedang);
      if (typeof student.sulit === 'number') scores.push(student.sulit);

      if (scores.length > 0) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        if (scores.length === 3) {
          if (avg >= 95) student.status = 'Sempurna ⭐';
          else if (avg >= 85) student.status = 'Sangat Memuaskan';
          else if (avg >= 70) student.status = 'Tuntas';
          else student.status = 'Perlu Bimbingan';
        } else {
          student.status = `Tuntas (${scores.length}/3 Kuis)`;
        }

        if (!updates.pblRefleksi) {
          if (avg >= 90) student.notes = 'Pemahaman anatomi jantung & sirkulasi darah sangat tinggi';
          else if (avg >= 75) student.notes = 'Memahami konsep dasar peredaran darah dengan baik';
          else student.notes = 'Perlu pendalaman materi dan bimbingan guru';
        }
      }

      student.lastActive = new Date().toISOString();
      this.saveRoster(roster);

      // Sinkronkan ke Dashboard Guru
      if (window.dashboardMgr) {
        window.dashboardMgr.renderStudentRosterTab();
      }
    } catch (e) {
      console.error('Gagal memperbarui nilai siswa:', e);
    }
  }

  deleteStudent(studentId) {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini dari Buku Nilai?')) {
      this.api(`/api/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' })
        .catch(error => this.showToast(error.message, 'error'));
      let roster = this.getRoster();
      roster = roster.filter(s => s.id !== studentId);
      this.saveRoster(roster);
      if (window.dashboardMgr) {
        window.dashboardMgr.renderStudentRosterTab();
      }
      this.showToast('🗑️ Data siswa berhasil dihapus dari Buku Nilai.', 'info');
    }
  }

  openStudentModal() {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const modal = document.getElementById('student-entry-modal');
    if (modal) {
      modal.style.display = 'flex';
      const nameInput = document.getElementById('student-input-name');
      const classInput = document.getElementById('student-input-class');
      if (nameInput && this.currentStudent) {
        nameInput.value = this.currentStudent.name;
      }
      if (classInput && this.currentStudent && this.currentStudent.className) {
        classInput.value = this.currentStudent.className;
      }
      if (nameInput) nameInput.focus();
    }
  }

  closeStudentModal() {
    const modal = document.getElementById('student-entry-modal');
    if (modal) modal.style.display = 'none';
  }

  handleStudentButtonClick() {
    this.openStudentModal();
  }

  // --- 3. SINKRONISASI UI ---
  updateUI() {
    const authBtn = document.getElementById('btn-auth-trigger');
    const studentBtn = document.getElementById('btn-student-trigger');
    const homeLoginCard = document.getElementById('home-auth-shortcut-card');
    const homeAccessSection = document.getElementById('home-access-section');
    const portalNavBtn = document.getElementById('nav-portal-btn');
    const portalNavLabel = portalNavBtn ? portalNavBtn.querySelector('.nav-portal-label') : null;

    if (portalNavBtn && portalNavLabel) {
      if (this.isLoggedIn()) {
        portalNavLabel.textContent = 'Akun Guru';
        portalNavBtn.title = `Akun Guru: ${this.currentUser.name}`;
      } else if (this.currentStudent) {
        portalNavLabel.textContent = 'Profil Siswa';
        portalNavBtn.title = `Profil Siswa: ${this.currentStudent.name}`;
      } else {
        portalNavLabel.textContent = 'Portal Masuk';
        portalNavBtn.title = 'Masuk sebagai siswa atau guru';
      }
    }

    // UI Tombol Siswa
    if (studentBtn) {
      if (this.currentStudent) {
        studentBtn.innerHTML = `
          <span class="auth-btn-avatar">🎒</span>
          <span class="auth-btn-name">${this.currentStudent.name} (${this.currentStudent.className})</span>
        `;
        studentBtn.title = `Profil Siswa: ${this.currentStudent.name} • Klik untuk ubah`;
        studentBtn.classList.add('has-student');
      } else {
        studentBtn.innerHTML = `
          <span>🎒 Masuk Siswa</span>
        `;
        studentBtn.title = 'Klik untuk memasukkan Nama & Kelas Siswa';
        studentBtn.classList.remove('has-student');
      }
    }

    // UI Tombol Guru
    if (authBtn) {
      if (this.isLoggedIn()) {
        authBtn.innerHTML = `
          <span class="auth-btn-avatar">${this.currentUser.avatar || 'GR'}</span>
          <span class="auth-btn-name">${this.currentUser.name} (Guru)</span>
          <span class="auth-btn-status-dot online"></span>
        `;
        authBtn.title = 'Buka Dashboard Guru ' + this.currentUser.name;
        authBtn.classList.add('logged-in');
      } else {
        authBtn.innerHTML = `
          <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>👩‍🏫 Login Guru</span>
        `;
        authBtn.title = 'Login khusus Pengajar / Guru (Akses Dashboard)';
        authBtn.classList.remove('logged-in');
      }
    }

    // UI Banner di Beranda
    if (homeLoginCard) {
      if (this.isLoggedIn()) {
        homeLoginCard.style.display = '';
        if (homeAccessSection) homeAccessSection.style.display = 'none';
        homeLoginCard.innerHTML = `
          <div class="shortcut-logged-banner">
            <div class="shortcut-info">
              <span class="user-badge-pulse">✨ Sesi Guru Aktif</span>
              <h3>Selamat Datang, Ibu ${this.currentUser.name}!</h3>
              <p>Kelola analitik siswa, buku nilai kelas VI, dan cetak sertifikat resmi di Dashboard Pengajar.</p>
            </div>
            <div class="shortcut-action" style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn-cta-main" onclick="navigateTo('view-dashboard')">
                <span>🚀 Buka Dashboard Guru</span>
              </button>
              <button class="btn-cta-secondary" onclick="window.authMgr.logout()" style="font-size: 0.88rem;">
                🚪 Keluar Guru
              </button>
            </div>
          </div>
        `;
      } else if (this.currentStudent) {
        homeLoginCard.style.display = '';
        if (homeAccessSection) homeAccessSection.style.display = 'none';
        homeLoginCard.innerHTML = `
          <div class="shortcut-logged-banner" style="background: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(6, 214, 160, 0.12)); border-color: rgba(58, 134, 255, 0.3);">
            <div class="shortcut-info">
              <span class="user-badge-pulse" style="background: rgba(58, 134, 255, 0.15); color: #3a86ff;">🎒 Siswa Aktif</span>
              <h3>Halo, ${this.currentStudent.name} (${this.currentStudent.className})!</h3>
              <p>Kamu sudah siap belajar! Raih skor tertinggi di kuis dan selesaikan tantangan investigasi PBL.</p>
            </div>
            <div class="shortcut-action" style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn-cta-main" onclick="navigateTo('view-quiz')">
                <span>🏆 Mulai Kuis Prestasi</span>
              </button>
              <button class="btn-cta-secondary" onclick="window.authMgr.logoutStudent()" style="font-size: 0.88rem;">
                🔄 Ganti / Keluar Siswa
              </button>
            </div>
          </div>
        `;
      } else {
        homeLoginCard.innerHTML = '';
        homeLoginCard.style.display = 'none';
        if (homeAccessSection) homeAccessSection.style.display = '';
      }
    }
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('app-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-global-toast';
      toast.className = 'app-toast-container';
      document.body.appendChild(toast);
    }

    const toastItem = document.createElement('div');
    toastItem.className = `toast-item toast-${type} animate-slideDown`;
    toastItem.innerHTML = `
      <div class="toast-content">
        <span>${message}</span>
      </div>
    `;

    toast.appendChild(toastItem);
    setTimeout(() => {
      toastItem.classList.add('fade-out');
      setTimeout(() => toastItem.remove(), 400);
    }, 3500);
  }
}

// -------------------------------------------------------------
// DASHBOARD MANAGER - PENGELOLA KONTEN & STATISTIK DASHBOARD
// -------------------------------------------------------------
class DashboardManager {
  constructor() {
    this.currentTab = 'tab-overview';
    this.currentFilter = 'all';
  }

  async refreshRoster(showToast = true) {
    if (!window.authMgr || !window.authMgr.isLoggedIn()) return;
    try {
      const students = await window.authMgr.loadTeacherRoster();
      this.renderDashboard();
      if (showToast) window.authMgr.showToast(`Data Supabase diperbarui: ${students.length} siswa.`, 'success');
      return students;
    } catch (error) {
      if (showToast) window.authMgr.showToast('Gagal memuat data Supabase: ' + error.message, 'error');
      return [];
    }
  }

  init() {
    this.renderDashboard();
  }

  switchTab(tabId) {
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.currentTab = tabId;

    document.querySelectorAll('.dash-nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dashTab === tabId);
    });

    document.querySelectorAll('.dash-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'tab-students') {
      this.renderStudentRosterTab();
      this.refreshRoster(false);
    }
  }

  getQuizProgress() {
    try {
      return JSON.parse(localStorage.getItem('hematology_quiz_progress') || '{}');
    } catch (e) {
      return {};
    }
  }

  getPblProgress() {
    try {
      return JSON.parse(localStorage.getItem('hematology_pbl_progress') || '{}');
    } catch (e) {
      return {};
    }
  }

  renderDashboard() {
    const user = window.authMgr ? window.authMgr.currentUser : null;
    const profileContainer = document.getElementById('dash-profile-header');
    if (!profileContainer) return;

    if (!user) {
      profileContainer.innerHTML = `
        <div class="dash-locked-alert">
          <div class="lock-icon">🔒</div>
          <div class="lock-text">
            <h3>Akses Terbatas: Silakan Login Terlebih Dahulu</h3>
            <p>Halaman Dashboard khusus untuk akun Pengajar/Guru. Silakan masuk menggunakan akun Guru Anda.</p>
          </div>
          <button class="btn-cta-main" onclick="window.authMgr.openLoginModal()">
            <span>🔑 Masuk Akun Guru</span>
          </button>
        </div>
      `;
      document.getElementById('dash-main-content-wrap')?.style.setProperty('display', 'none');
      return;
    }

    document.getElementById('dash-main-content-wrap')?.style.setProperty('display', 'block');

    const roster = window.authMgr ? window.authMgr.getRoster() : [];

    // Hitung rata-rata skor kelas dari data riil
    let totalScore = 0;
    let completedCount = 0;
    roster.forEach(s => {
      if (typeof s.mudah === 'number') { totalScore += s.mudah; completedCount++; }
      if (typeof s.sedang === 'number') { totalScore += s.sedang; completedCount++; }
      if (typeof s.sulit === 'number') { totalScore += s.sulit; completedCount++; }
    });
    const avgClassScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
    const completedStudents = roster.filter(s => s.status && (s.status.includes('Tuntas') || s.status.includes('Sangat') || s.status.includes('Sempurna'))).length;
    const completionRate = roster.length ? Math.round((completedStudents / roster.length) * 100) : 0;
    const completionLabel = completionRate >= 85 ? 'Sangat Baik' : completionRate >= 70 ? 'Baik' : completionRate > 0 ? 'Perlu Pendampingan' : 'Belum Ada Data';

    // Header Profile
    profileContainer.innerHTML = `
      <div class="dash-user-hero">
        <div class="user-hero-avatar-wrap">
          <div class="user-hero-avatar">${user.avatar || 'GR'}</div>
          <div class="user-online-badge">ONLINE</div>
        </div>
        <div class="user-hero-details">
          <div class="user-role-pill">⭐ ${user.role}</div>
          <h2>${user.name}</h2>
          <p class="user-school-txt">🏫 ${user.school} • ID: <code>${user.username}</code></p>
          <div class="user-last-login">
            <span>🕒 Sesi Masuk: ${new Date(user.loginTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
            <span>•</span>
            <span class="user-status-ok">Sistem Terverifikasi</span>
          </div>
        </div>
        <div class="user-hero-actions">
          <button class="btn-cta-main" onclick="window.dashboardMgr.switchTab('tab-students')">
            <span>Buka Buku Nilai</span>
          </button>
          <button class="btn-cta-secondary btn-logout" onclick="window.authMgr.logout()">
            <span>🚪 Keluar</span>
          </button>
        </div>
      </div>
    `;

    const accountName = document.getElementById('account-profile-name');
    const accountEmail = document.getElementById('account-profile-email');
    const accountRole = document.getElementById('account-profile-role');
    const accountSchool = document.getElementById('account-profile-school');
    if (accountName) accountName.textContent = user.name;
    if (accountEmail) accountEmail.textContent = user.email || user.username;
    if (accountRole) accountRole.textContent = user.appRole === 'admin' ? 'Administrator Sekolah' : 'Guru Pengajar';
    if (accountSchool) accountSchool.textContent = user.school;

    // KPI Cards
    const kpiWrap = document.getElementById('dash-kpi-grid');
    if (kpiWrap) {
      kpiWrap.innerHTML = `
        <div class="dash-kpi-card card-kpi-1">
          <div class="kpi-icon-badge">🏆</div>
          <div class="kpi-info">
            <span class="kpi-label">Siswa Terdaftar</span>
            <h3 class="kpi-value">${roster.length}</h3>
            <span class="kpi-subtext">Anggota kelas aktif di Supabase</span>
          </div>
        </div>

        <div class="dash-kpi-card card-kpi-2">
          <div class="kpi-icon-badge">👥</div>
          <div class="kpi-info">
            <span class="kpi-label">Siswa Menyelesaikan PBL</span>
            <h3 class="kpi-value">${roster.filter(s => s.pbl && !s.pbl.startsWith('0')).length} <small>/ ${roster.length}</small></h3>
            <span class="kpi-subtext">Studi Kasus Dokter Cilik</span>
          </div>
        </div>

        <div class="dash-kpi-card card-kpi-3">
          <div class="kpi-icon-badge">⭐</div>
          <div class="kpi-info">
            <span class="kpi-label">Rata-Rata Nilai Kuis</span>
            <h3 class="kpi-value">${avgClassScore} <small>/ 100</small></h3>
            <span class="kpi-subtext">Akumulasi 3 Tingkat Kuis</span>
          </div>
        </div>

        <div class="dash-kpi-card card-kpi-4">
          <div class="kpi-icon-badge">⚡</div>
          <div class="kpi-info">
            <span class="kpi-label">Ketuntasan Kelas</span>
            <h3 class="kpi-value" style="color: var(--emerald-green); font-size: 1.4rem;">
              ${completionRate}%
            </h3>
            <span class="kpi-subtext">Status: ${completionLabel}</span>
          </div>
        </div>
      `;
    }

    // Render Tab 1: Quiz Overview
    this.renderQuizTab(roster);

    // Render Tab 2: PBL Portfolio
    this.renderPblTab(roster);

    // Render Tab 3: Student Roster
    this.renderStudentRosterTab();
  }

  renderQuizTab(roster) {
    const container = document.getElementById('dash-quiz-cards-wrap');
    if (!container) return;

    const levels = [
      { id: 'mudah', name: 'Tingkat Mudah', questions: 'Alur peredaran darah kecil', color: '#06a77d', icon: '1' },
      { id: 'sedang', name: 'Tingkat Sedang', questions: 'Alur peredaran darah besar', color: '#d89b00', icon: '2' },
      { id: 'sulit', name: 'Tingkat Sulit', questions: 'Gabungan sirkulasi lengkap', color: '#d93654', icon: '3' }
    ];

    container.innerHTML = levels.map(lvl => {
      const scores = roster.map(student => student[lvl.id]).filter(Number.isFinite);
      const average = scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;
      const completion = roster.length ? Math.round((scores.length / roster.length) * 100) : 0;

      return `
        <div class="dash-quiz-item-card" style="border-top-color: ${lvl.color}">
          <div class="dash-quiz-head">
            <div class="dash-quiz-icon">${lvl.icon}</div>
            <div>
              <h4>${lvl.name}</h4>
              <p class="dash-quiz-sub">${lvl.questions}</p>
            </div>
            <span class="dash-status-pill ${scores.length ? 'done' : 'ready'}">
              ${scores.length} dari ${roster.length} siswa
            </span>
          </div>

          <div class="dash-quiz-stats-row">
            <div class="dash-score-stat">
              <span class="score-num" style="color: ${lvl.color}">${average}</span>
              <span class="score-unit">Rata-rata</span>
            </div>
            <div class="dash-score-stat">
              <span class="score-num" style="color: var(--cardiac-blue)">${completion}%</span>
              <span class="score-unit">Partisipasi</span>
            </div>
            <div class="dash-score-stat">
              <span class="score-num" style="color: var(--text-muted)">${roster.length - scores.length}</span>
              <span class="score-unit">Belum mengerjakan</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPblTab(roster) {
    const container = document.getElementById('dash-pbl-portfolio-wrap');
    if (!container) return;

    const completedCases = roster.reduce((total, student) => total + (parseInt(student.pbl, 10) || 0), 0);
    const pblScores = roster.map(student => student.pblScore).filter(Number.isFinite);
    const averagePbl = pblScores.length ? Math.round(pblScores.reduce((total, score) => total + score, 0) / pblScores.length) : 0;
    const activeStudents = roster.filter(student => (parseInt(student.pbl, 10) || 0) > 0).length;
    const needsFollowUp = roster.filter(student => !Number.isFinite(student.pblScore) || student.pblScore < 75).length;

    const summaries = [
      { label: 'Kasus selesai', value: completedCases, note: 'Total seluruh pengumpulan siswa' },
      { label: 'Siswa berpartisipasi', value: `${activeStudents}/${roster.length}`, note: 'Sudah mengirim minimal satu kasus' },
      { label: 'Rata-rata nilai PBL', value: averagePbl, note: 'Dari pengumpulan yang telah dinilai' },
      { label: 'Perlu tindak lanjut', value: needsFollowUp, note: 'Belum dinilai atau nilai di bawah 75' }
    ];

    container.innerHTML = `<div class="dash-pbl-summary-grid">${summaries.map(item => `
      <article class="dash-pbl-summary-card">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        <p>${item.note}</p>
      </article>
    `).join('')}</div>`;
  }

  renderStudentRosterTab() {
    const tableBody = document.getElementById('dash-students-table-body');
    if (!tableBody) return;

    let roster = window.authMgr ? window.authMgr.getRoster() : [];
    const currentStudentName = window.authMgr && window.authMgr.currentStudent ? window.authMgr.currentStudent.name.toLowerCase() : '';

    const parseTimeValue = (s) => {
      const timeStr = s.joinedAt || s.loginTime || s.lastActive;
      if (!timeStr) {
        const idNum = parseInt((s.id || '').replace(/\D/g, ''), 10);
        return isNaN(idNum) ? 9999999999999 : idNum * 1000;
      }
      if (typeof timeStr === 'string' && timeStr.includes('/')) {
        const parts = timeStr.split(/[, ]+/);
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
          const d = parseInt(dateParts[0], 10);
          const m = parseInt(dateParts[1], 10) - 1;
          const y = parseInt(dateParts[2], 10);
          const timeParts = (parts[1] || '00:00:00').split(/[:.]/);
          const h = parseInt(timeParts[0] || 0, 10);
          const min = parseInt(timeParts[1] || 0, 10);
          const sec = parseInt(timeParts[2] || 0, 10);
          const parsedDate = new Date(y, m, d, h, min, sec);
          if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
        }
      }
      const dateObj = new Date(timeStr);
      if (!isNaN(dateObj.getTime())) return dateObj.getTime();
      const idNum = parseInt((s.id || '').replace(/\D/g, ''), 10);
      return isNaN(idNum) ? 9999999999999 : idNum * 1000;
    };

    const hasDoneQuestions = (s) => {
      return typeof s.mudah === 'number' || typeof s.sedang === 'number' || typeof s.sulit === 'number' || (s.pbl && typeof s.pbl === 'string' && !s.pbl.startsWith('0'));
    };

    // Terapkan Filter & Pengurutan: Pengguna pertama masuk & mengerjakan soal teratas
    if (this.currentFilter === 'first-done') {
      roster = roster.filter(s => hasDoneQuestions(s));
      roster.sort((a, b) => parseTimeValue(a) - parseTimeValue(b)); // Urutan pertama masuk & mengerjakan teratas
    } else if (this.currentFilter === 'online') {
      roster = roster.filter(s => currentStudentName && s.name.toLowerCase() === currentStudentName);
    } else if (this.currentFilter === 'done') {
      roster = roster.filter(s => hasDoneQuestions(s));
      roster.sort((a, b) => parseTimeValue(a) - parseTimeValue(b));
    } else if (this.currentFilter === 'pending') {
      roster = roster.filter(s => !hasDoneQuestions(s));
      roster.sort((a, b) => parseTimeValue(a) - parseTimeValue(b));
    } else {
      // Filter 'all': Prioritaskan yang sudah mengerjakan, diurutkan dari yang pertama kali masuk
      roster.sort((a, b) => {
        const aDone = hasDoneQuestions(a);
        const bDone = hasDoneQuestions(b);
        if (aDone && !bDone) return -1;
        if (!aDone && bDone) return 1;
        return parseTimeValue(a) - parseTimeValue(b);
      });
    }

    if (roster.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
            <strong style="color: var(--text-heading); font-size: 1.05rem;">Tidak ada data siswa untuk filter ini</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.88rem;">Siswa yang login dari halaman utama akan otomatis tercatat dan muncul di sini.</p>
          </td>
        </tr>
      `;
      return;
    }

    const formatLoginTime = (timeInput) => {
      if (!timeInput) return 'Hari ini';
      if (typeof timeInput === 'string' && timeInput.includes('WIB')) return timeInput;

      // Format DD/MM/YYYY, HH.MM.SS atau DD/MM/YYYY HH:MM:SS
      if (typeof timeInput === 'string' && timeInput.includes('/')) {
        const parts = timeInput.split(/[, ]+/);
        if (parts.length >= 2) {
          const timeParts = parts[1].split(/[:.]/);
          if (timeParts.length >= 2) {
            return `${String(timeParts[0]).padStart(2, '0')}.${String(timeParts[1]).padStart(2, '0')} WIB`;
          }
        }
      }

      try {
        const d = new Date(timeInput);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.') + ' WIB';
        }
      } catch (e) {}

      return typeof timeInput === 'string' && timeInput.trim() ? timeInput : 'Hari ini';
    };

    tableBody.innerHTML = roster.map((s, idx) => {
      const isCurrentActive = currentStudentName && s.name.toLowerCase() === currentStudentName;

      const formatScoreBadge = (score) => {
        if (score === '-' || score === undefined || score === null) {
          return `<span class="badge-table-score score-muted" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-weight: normal;">Belum</span>`;
        }
        const num = Number(score);
        if (num >= 85) return `<span class="badge-table-score score-green">${num}</span>`;
        if (num >= 70) return `<span class="badge-table-score score-yellow">${num}</span>`;
        return `<span class="badge-table-score score-red">${num}</span>`;
      };

      // Hitung Berapa Kuis yang Sudah Dikerjakan
      let quizDoneCount = 0;
      if (typeof s.mudah === 'number') quizDoneCount++;
      if (typeof s.sedang === 'number') quizDoneCount++;
      if (typeof s.sulit === 'number') quizDoneCount++;

      const isPblDone = s.pbl && !s.pbl.startsWith('0');

      let progressBadge = '';
      if (quizDoneCount === 3 && isPblDone) {
        progressBadge = `<span class="badge-status-tuntas" style="background: rgba(6, 214, 160, 0.22); color: #059669; font-weight: 800;">⭐ Lulus Lengkap</span>`;
      } else if (quizDoneCount === 3) {
        progressBadge = `<span class="badge-status-tuntas" style="background: rgba(6, 214, 160, 0.18); color: #059669;">✅ 3/3 Kuis Tuntas</span>`;
      } else if (quizDoneCount > 0) {
        progressBadge = `<span class="badge-status-tuntas" style="background: rgba(255, 190, 11, 0.2); color: #b45309;">📝 Mengerjakan (${quizDoneCount}/3)</span>`;
      } else {
        progressBadge = `<span class="badge-status-tuntas" style="background: rgba(58, 134, 255, 0.15); color: #2563eb;">🟢 Login (Belum Kuis)</span>`;
      }

      return `
        <tr class="${isCurrentActive ? 'active-student-row' : ''}">
          <td><strong>${idx + 1}</strong></td>
          <td>
            <div class="student-cell-profile">
              <span class="student-avatar-circle" style="${isCurrentActive ? 'background: linear-gradient(135deg, #06d6a0, #3a86ff); box-shadow: 0 0 10px rgba(6,214,160,0.5);' : ''}">
                ${s.avatar || s.name.charAt(0)}
              </span>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: var(--text-heading); font-size: 0.95rem;">${s.name}</strong>
                  ${isCurrentActive ? `<span class="badge-tag-online">ONLINE</span>` : ''}
                </div>
                <small class="student-id-txt">${s.id} • ${s.className || 'Kelas VI-A'}</small>
              </div>
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: ${isCurrentActive ? '#059669' : 'var(--text-main)'};">
                ${isCurrentActive ? '🟢 Sedang Aktif' : '🕒 Terakhir Masuk'}
              </span>
              <small style="color: var(--text-muted); font-size: 0.78rem;">${formatLoginTime(s.loginTime || s.lastActive || s.joinedAt)}</small>
            </div>
          </td>
          <td>${formatScoreBadge(s.mudah)}</td>
          <td>${formatScoreBadge(s.sedang)}</td>
          <td>${formatScoreBadge(s.sulit)}</td>
          <td><span class="badge-table-pbl">${s.pbl || '0 Kasus'}</span></td>
          <td>${progressBadge}</td>
          <td class="student-notes-cell">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
              <span title="${s.notes || '-'}" style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.notes || '-'}</span>
              <div style="display: flex; gap: 4px; flex-shrink: 0;">
                <button title="Cetak Rapor Siswa Ini" onclick="window.dashboardMgr.printSingleStudent('${s.id}')" class="btn-table-action" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 0.85rem;" onmouseover="this.style.borderColor='var(--cardiac-blue)'" onmouseout="this.style.borderColor='var(--border-subtle)'">🖨️</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  setFilter(filterType) {
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.currentFilter = filterType;

    document.querySelectorAll('.dash-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    this.renderStudentRosterTab();
  }

  filterStudents(query) {
    const q = (query || '').toLowerCase();
    const rows = document.querySelectorAll('#dash-students-table-body tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  }

  exportStudentsCSV() {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const roster = window.authMgr ? window.authMgr.getRoster() : [];
    let csv = 'No,ID Siswa,Nama Lengkap,Kelas,Kuis Mudah,Kuis Sedang,Kuis Sulit,Asesmen PBL,Status,Catatan Guru\n';
    roster.forEach((s, i) => {
      const mudahVal = s.mudah !== undefined ? s.mudah : '-';
      const sedangVal = s.sedang !== undefined ? s.sedang : '-';
      const sulitVal = s.sulit !== undefined ? s.sulit : '-';
      const pblVal = s.pbl || '0 Kasus';
      const notesClean = (s.notes || '-').replace(/"/g, '""');
      csv += `"${i + 1}","${s.id}","${s.name}","${s.className || 'Kelas VI-A'}","${mudahVal}","${sedangVal}","${sulitVal}","${pblVal}","${s.status}","${notesClean}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Buku_Nilai_Sistem_Peredaran_Darah_Kelas_VI_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.authMgr.showToast('📥 Berhasil mengekspor data Buku Nilai Siswa (CSV)!', 'success');
  }

  claimCert(levelTitle) {
    const student = window.authMgr && window.authMgr.currentStudent ? window.authMgr.currentStudent : (window.authMgr ? window.authMgr.currentUser : null);
    const name = student ? student.name : 'Siswa HemoExplorer';
    if (window.quizEngine) {
      const levelKey = /mudah/i.test(levelTitle) ? 'mudah' : /sedang/i.test(levelTitle) ? 'sedang' : /sulit/i.test(levelTitle) ? 'sulit' : null;
      const engineLevel = { mudah: 'kecil', sedang: 'besar', sulit: 'gabungan' }[levelKey];
      const progress = this.getQuizProgress();
      const result = levelKey ? (progress[levelKey] || progress[engineLevel]) : null;
      if (engineLevel) window.quizEngine.currentLevel = engineLevel;
      if (result && Number.isFinite(Number(result.score))) window.quizEngine.score = Number(result.score);
      window.quizEngine.generateCertificate(name, levelTitle);
    }
  }

  printSingleStudent(studentId) {
    const roster = window.authMgr ? window.authMgr.getRoster() : [];
    const student = roster.find(s => s.id === studentId);
    if (student) {
      this.printTranscript(student);
    }
  }

  printTranscript(studentTarget = null) {
    if (window.audioMgr) window.audioMgr.playClickSound();
    let target = studentTarget;
    if (!target) {
      target = (window.authMgr && window.authMgr.currentStudent) ? window.authMgr.currentStudent : (window.authMgr ? window.authMgr.currentUser : { name: 'Meisya Ranny', school: 'SD Kelas VI' });
    }

    const roster = window.authMgr ? window.authMgr.getRoster() : [];
    const studentData = roster.find(s => s.name.toLowerCase() === target.name.toLowerCase()) || target;

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const printWin = window.open('', '_blank');

    const mudahScore = studentData.mudah !== undefined && studentData.mudah !== '-' ? studentData.mudah : 100;
    const sedangScore = studentData.sedang !== undefined && studentData.sedang !== '-' ? studentData.sedang : 100;
    const sulitScore = studentData.sulit !== undefined && studentData.sulit !== '-' ? studentData.sulit : 95;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rapor Capaian Pembelajaran - ${studentData.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { text-align: center; border-bottom: 3px double #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
          .header h1 { font-size: 20px; color: #d90429; margin: 0 0 6px 0; text-transform: uppercase; }
          .header p { margin: 2px 0; font-size: 13px; color: #64748b; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          .info-table td { padding: 6px 12px; }
          .info-table tr:nth-child(even) { background-color: #f8fafc; }
          .score-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
          .score-table th, .score-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
          .score-table th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .badge-tuntas { background: #dcfce7; color: #15803d; }
          .footer-sign { display: flex; justify-content: space-between; margin-top: 60px; font-size: 14px; }
          .sign-box { text-align: center; width: 220px; }
          .sign-space { height: 70px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RAPOR PRESTASI PEMBELAJARAN INTERAKTIF</h1>
          <p><strong>Topik: Sistem Peredaran Darah Manusia • Kelas VI Sekolah Dasar</strong></p>
          <p>Media Berbasis Digital 3D Simulation & Problem-Based Learning (HemoExplorer)</p>
        </div>

        <table class="info-table">
          <tr>
            <td width="25%"><strong>Nama Siswa / Pengguna</strong></td>
            <td width="2%">:</td>
            <td><strong>${studentData.name}</strong></td>
            <td width="20%"><strong>Tanggal Cetak</strong></td>
            <td width="2%">:</td>
            <td>${today}</td>
          </tr>
          <tr>
            <td><strong>ID / NIS Siswa</strong></td>
            <td>:</td>
            <td><code>${studentData.id || 'SIS-01'}</code></td>
            <td><strong>Status Kelulusan</strong></td>
            <td>:</td>
            <td><strong style="color: #15803d;">${studentData.status || 'LULUS SANGAT BAIK ⭐'}</strong></td>
          </tr>
          <tr>
            <td><strong>Jenjang & Kelas</strong></td>
            <td>:</td>
            <td>${studentData.className || 'SD Kelas VI • IPA Kurikulum Merdeka'}</td>
            <td><strong>Predikat Akhir</strong></td>
            <td>:</td>
            <td>Dokter Cilik Teladan (A+)</td>
          </tr>
        </table>

        <h3 style="font-size: 16px; margin-bottom: 10px; color: #0f172a;">A. Rekapitulasi Nilai Kuis 3 Tingkat</h3>
        <table class="score-table">
          <thead>
            <tr>
              <th width="8%">No</th>
              <th>Komponen Uji Kompetensi</th>
              <th width="20%">Capaian Nilai</th>
              <th width="20%">Tingkat Akurasi</th>
              <th width="20%">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Kuis Tingkat Mudah (Peredaran Darah Kecil)</td>
              <td><strong>${mudahScore} / 100</strong></td>
              <td>${mudahScore}%</td>
              <td><span class="badge badge-tuntas">Tuntas Sempurna</span></td>
            </tr>
            <tr>
              <td>2</td>
              <td>Kuis Tingkat Sedang (Peredaran Darah Besar)</td>
              <td><strong>${sedangScore} / 100</strong></td>
              <td>${sedangScore}%</td>
              <td><span class="badge badge-tuntas">Tuntas Sempurna</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td>Kuis Tingkat Sulit (Gabungan Alur Utuh)</td>
              <td><strong>${sulitScore} / 100</strong></td>
              <td>${sulitScore}%</td>
              <td><span class="badge badge-tuntas">Tuntas Sangat Baik</span></td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size: 16px; margin-bottom: 10px; color: #0f172a;">B. Rekapitulasi Portofolio Problem-Based Learning (PBL)</h3>
        <table class="score-table">
          <thead>
            <tr>
              <th width="8%">No</th>
              <th>Studi Kasus Penyelidikan</th>
              <th width="25%">Fokus Saintifik</th>
              <th width="18%">Skor Investigasi</th>
              <th width="18%">Status Sintaks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Kasus 1: Hidung Berdarah Saat Upacara</td>
              <td>Trombosit & Pembekuan Darah</td>
              <td><strong>100 / 100</strong></td>
              <td><span class="badge badge-tuntas">5 Tahap Selesai</span></td>
            </tr>
            <tr>
              <td>2</td>
              <td>Kasus 2: Wajah Pucat & Cepat Lelah</td>
              <td>Eritrosit & Penanganan Anemia</td>
              <td><strong>95 / 100</strong></td>
              <td><span class="badge badge-tuntas">5 Tahap Selesai</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td>Kasus 3: Jantung Berdebar Saat Olahraga</td>
              <td>Frekuensi Nadi & Sirkulasi</td>
              <td><strong>100 / 100</strong></td>
              <td><span class="badge badge-tuntas">5 Tahap Selesai</span></td>
            </tr>
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">
            <p>Mengetahui,<br>Guru Pengampu IPA</p>
            <div class="sign-space"></div>
            <p><strong>( Meisya Ranny, S.Pd. )</strong><br><small>NIP. 19920815 201802 2 004</small></p>
          </div>

          <div class="sign-box">
            <p>Siswa / Peserta Didik,<br>&nbsp;</p>
            <div class="sign-space"></div>
            <p><strong>( ${studentData.name} )</strong><br><small>ID: ${studentData.id || 'SIS-01'}</small></p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 600);
  }
}

// Inisialisasi Instance Global
window.authMgr = new AuthManager();
window.dashboardMgr = new DashboardManager();

