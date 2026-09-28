/**
 * MODUL ASESMEN PROBLEM-BASED LEARNING (PBL)
 * Sintaks Pembelajaran Berbasis Masalah 5 Fase untuk Siswa Kelas VI SD
 */

class PBLManager {
  constructor() {
    this.currentCaseIndex = 0;
    this.currentPhase = 1; // 1: Orientasi, 2: Organisasi, 3: Penyelidikan, 4: Solusi, 5: Evaluasi
    this.answers = {
      masalah: null,
      faktaTerpilih: [],
      labPenyelidikan: 0,
      solusiTerpilih: [],
      refleksi: ""
    };

    this.container = document.getElementById('pbl-view');
  }

  init() {
    this.renderCaseSelector();
    this.loadCase(0);
  }

  renderCaseSelector() {
    const selectorContainer = document.getElementById('pbl-cases-tabs');
    if (!selectorContainer) return;

    selectorContainer.innerHTML = '';
    CIRCULATORY_DATA.pblCases.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `pbl-tab-btn ${idx === this.currentCaseIndex ? 'active' : ''}`;
      btn.innerHTML = `<span>${c.icon}</span> <span>${c.title.split(':')[0]}</span>`;
      btn.onclick = () => {
        if (window.audioMgr) window.audioMgr.playClickSound();
        this.loadCase(idx);
      };
      selectorContainer.appendChild(btn);
    });
  }

  loadCase(caseIdx) {
    this.currentCaseIndex = caseIdx;
    this.currentPhase = 1;
    this.answers = {
      masalah: null,
      faktaTerpilih: [],
      labPenyelidikan: 0,
      solusiTerpilih: [],
      refleksi: ""
    };

    // Update Tab Active
    document.querySelectorAll('.pbl-tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === caseIdx);
    });

    this.renderPhaseView();
  }

  setPhase(phaseNum) {
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.currentPhase = phaseNum;
    this.renderPhaseView();
  }

  renderPhaseView() {
    const caseData = CIRCULATORY_DATA.pblCases[this.currentCaseIndex];
    const headerTitle = document.getElementById('pbl-case-title');
    const headerBadge = document.getElementById('pbl-case-badge');
    const stepsIndicator = document.getElementById('pbl-steps-indicator');
    const phaseContent = document.getElementById('pbl-phase-content');

    if (headerTitle) headerTitle.innerHTML = `${caseData.icon} ${caseData.title}`;
    if (headerBadge) headerBadge.textContent = caseData.badge;

    // Render 5 Steps Header
    if (stepsIndicator) {
      const steps = [
        "1. Orientasi Masalah",
        "2. Organisasi Belajar",
        "3. Uji Virtual Lab",
        "4. Kembangkan Solusi",
        "5. Evaluasi & Refleksi"
      ];
      stepsIndicator.innerHTML = steps.map((s, idx) => `
        <button class="pbl-step-bubble ${this.currentPhase === idx + 1 ? 'active' : ''} ${this.currentPhase > idx + 1 ? 'completed' : ''}" onclick="window.pblManager.setPhase(${idx + 1})">
          <span class="step-num">${idx + 1}</span>
          <span class="step-txt">${s.split('. ')[1]}</span>
        </button>
      `).join('');
    }

    // Render masing-masing fase
    if (!phaseContent) return;

    if (this.currentPhase === 1) {
      this.renderPhase1Orientasi(caseData, phaseContent);
    } else if (this.currentPhase === 2) {
      this.renderPhase2Organisasi(caseData, phaseContent);
    } else if (this.currentPhase === 3) {
      this.renderPhase3Penyelidikan(caseData, phaseContent);
    } else if (this.currentPhase === 4) {
      this.renderPhase4Solusi(caseData, phaseContent);
    } else if (this.currentPhase === 5) {
      this.renderPhase5Evaluasi(caseData, phaseContent);
    }
  }

  // FASE 1: ORIENTASI MASALAH
  renderPhase1Orientasi(caseData, container) {
    container.innerHTML = `
      <div class="pbl-card animate-fadeIn">
        <div class="pbl-scenario-box">
          <div class="scenario-header">
            <h3>📖 Kisah Studi Kasus Nyata</h3>
            <button class="audio-btn-pill" onclick="window.audioMgr.speakText('${caseData.scenario.replace(/'/g, "\\'")}')">
              <span>🔊 Dengarkan Narasi</span>
            </button>
          </div>
          <p class="scenario-text">${caseData.scenario}</p>
        </div>

        <div class="pbl-task-box">
          <h4>🎯 Langkah 1: Identifikasi Masalah Utama</h4>
          <p class="task-desc">${caseData.fase.orientasi.tanya}</p>
          <div class="task-hint">💡 <em>Petunjuk: ${caseData.fase.orientasi.petunjuk}</em></div>

          <div class="pbl-choices-grid">
            ${caseData.fase.orientasi.pilihanMasalah.map((opt, idx) => `
              <label class="pbl-radio-card ${this.answers.masalah === idx ? 'selected' : ''}">
                <input type="radio" name="pbl-orientasi" value="${idx}" ${this.answers.masalah === idx ? 'checked' : ''} onchange="window.pblManager.handlePhase1Select(${idx})">
                <span class="radio-indicator"></span>
                <span class="radio-label">${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="pbl-nav-footer">
          <div></div>
          <button class="btn-pbl-primary" onclick="window.pblManager.setPhase(2)">
            Lanjut ke Organisasi Belajar ➔
          </button>
        </div>
      </div>
    `;
  }

  handlePhase1Select(idx) {
    this.answers.masalah = idx;
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.renderPhaseView();
  }

  // FASE 2: MENGORGANISASI BELAJAR
  renderPhase2Organisasi(caseData, container) {
    container.innerHTML = `
      <div class="pbl-card animate-fadeIn">
        <div class="pbl-task-box">
          <h4>📋 Langkah 2: Mengumpulkan & Mengelompokkan Fakta Ilmiah</h4>
          <p class="task-desc">${caseData.fase.organisasi.tanya}</p>

          <div class="pbl-checklist-grid">
            ${caseData.fase.organisasi.itemWajib.map((item, idx) => `
              <label class="pbl-check-card ${this.answers.faktaTerpilih.includes(idx) ? 'checked' : ''}">
                <input type="checkbox" value="${idx}" ${this.answers.faktaTerpilih.includes(idx) ? 'checked' : ''} onchange="window.pblManager.handlePhase2Check(${idx})">
                <span class="check-box-icon"></span>
                <span class="check-text">${item.text}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="pbl-nav-footer">
          <button class="btn-pbl-secondary" onclick="window.pblManager.setPhase(1)">⬅ Kembali</button>
          <button class="btn-pbl-primary" onclick="window.pblManager.setPhase(3)">Lanjut ke Uji Virtual Lab ➔</button>
        </div>
      </div>
    `;
  }

  handlePhase2Check(idx) {
    if (this.answers.faktaTerpilih.includes(idx)) {
      this.answers.faktaTerpilih = this.answers.faktaTerpilih.filter(i => i !== idx);
    } else {
      this.answers.faktaTerpilih.push(idx);
    }
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.renderPhaseView();
  }

  // FASE 3: PENYELIDIKAN VIRTUAL LAB
  renderPhase3Penyelidikan(caseData, container) {
    container.innerHTML = `
      <div class="pbl-card animate-fadeIn">
        <div class="pbl-task-box">
          <h4>🔬 Langkah 3: ${caseData.fase.penyelidikan.title}</h4>
          <p class="task-desc">${caseData.fase.penyelidikan.deskripsi}</p>

          <!-- Simulator Lab Interaktif Sederhana -->
          <div class="interactive-lab-widget">
            <div class="lab-controls">
              <label><strong>${caseData.fase.penyelidikan.sliderLabel}:</strong></label>
              <div class="slider-row">
                <span>Rendah (0%)</span>
                <input type="range" min="0" max="100" value="${this.answers.labPenyelidikan}" id="pbl-lab-slider" oninput="window.pblManager.updateLabVisual(this.value)">
                <span>Tinggi (100%)</span>
              </div>
            </div>

            <div class="lab-visual-box" id="pbl-lab-display">
              <!-- Render dinamik canvas/SVG pipa arteri & manometer tekanan -->
            </div>
          </div>
        </div>

        <div class="pbl-nav-footer">
          <button class="btn-pbl-secondary" onclick="window.pblManager.setPhase(2)">⬅ Kembali</button>
          <button class="btn-pbl-primary" onclick="window.pblManager.setPhase(4)">Lanjut ke Kembangkan Solusi ➔</button>
        </div>
      </div>
    `;

    this.updateLabVisual(this.answers.labPenyelidikan);
  }

  updateLabVisual(val) {
    this.answers.labPenyelidikan = parseInt(val, 10);
    const display = document.getElementById('pbl-lab-display');
    if (!display) return;

    if (this.currentCaseIndex === 0) {
      // Kasus 1: Plak Arteri & Tekanan Darah Hipertensi
      const pressureSys = 115 + Math.round((val / 100) * 60);
      const pressureDia = 75 + Math.round((val / 100) * 35);
      const lumenRadius = 45 - (val * 0.32);

      display.innerHTML = `
        <div class="lab-art-grid">
          <div class="artery-cross-section">
            <h5>Potongan Melintang Pembuluh Nadi</h5>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="75" fill="#e63946" stroke="#9d0208" stroke-width="8"/>
              <circle cx="90" cy="90" r="65" fill="#ffd166" />
              <circle cx="90" cy="90" r="${Math.max(12, lumenRadius)}" fill="#670014" />
              <text x="90" y="95" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">Aliran Darah</text>
            </svg>
            <p class="caption">Penyempitan Saluran: <strong>${val}%</strong></p>
          </div>

          <div class="gauge-display-box">
            <h5>Tensimeter Digital Virtual</h5>
            <div class="gauge-reading ${pressureSys > 140 ? 'danger-reading' : 'normal-reading'}">
              <span class="main-pressure">${pressureSys} / ${pressureDia}</span>
              <span class="unit">mmHg</span>
            </div>
            <p class="status-tag">${pressureSys > 140 ? '⚠️ Kategori: Hipertensi Tinggi' : '✅ Kategori: Normal Sehat'}</p>
            <button class="btn-sound-pulse" onclick="window.audioMgr.playLubDub('${pressureSys > 140 ? 'hipertensi' : 'normal'}')">
              💓 Dengar Detak Jantung
            </button>
          </div>
        </div>
      `;
    } else if (this.currentCaseIndex === 1) {
      // Kasus 2: Detak Jantung Latihan
      const bpm = 60 + Math.round((val / 100) * 90);
      display.innerHTML = `
        <div class="lab-art-grid">
          <div class="gauge-display-box">
            <h5>Frekuensi Denyut Nadi</h5>
            <div class="gauge-reading normal-reading">
              <span class="main-pressure">${bpm}</span>
              <span class="unit">BPM</span>
            </div>
            <p class="status-tag">${val > 60 ? '🏃‍♂️ Fase Lari Kencang (Kebutuhan O₂ Tinggi)' : '🚶‍♂️ Fase Santai / Istirahat'}</p>
            <button class="btn-sound-pulse" onclick="window.audioMgr.playLubDub('normal')">
              💓 Dengar Kecepatan Denyut
            </button>
          </div>
        </div>
      `;
    } else {
      // Kasus 3: Kadar Hemoglobin Anemia
      const rbcCount = 2.0 + (val / 100) * 3.2;
      display.innerHTML = `
        <div class="lab-art-grid">
          <div class="gauge-display-box">
            <h5>Kepadatan Sel Darah Merah (Eritrosit)</h5>
            <div class="gauge-reading ${rbcCount < 4.0 ? 'danger-reading' : 'normal-reading'}">
              <span class="main-pressure">${rbcCount.toFixed(1)}</span>
              <span class="unit">Juta / µL</span>
            </div>
            <p class="status-tag">${rbcCount < 4.0 ? '🥀 Anemia (Kekurangan Hemoglobin)' : '🩸 Darah Sehat & Bugar'}</p>
          </div>
        </div>
      `;
    }
  }

  // FASE 4: MENGEMBANGKAN SOLUSI
  renderPhase4Solusi(caseData, container) {
    container.innerHTML = `
      <div class="pbl-card animate-fadeIn">
        <div class="pbl-task-box">
          <h4>💡 Langkah 4: Merumuskan Rencana Aksi Solusi Sehat</h4>
          <p class="task-desc">${caseData.fase.solusi.tanya}</p>

          <div class="pbl-checklist-grid">
            ${caseData.fase.solusi.opsiSolusi.map((sol, idx) => `
              <label class="pbl-check-card ${this.answers.solusiTerpilih.includes(idx) ? 'checked' : ''}">
                <input type="checkbox" value="${idx}" ${this.answers.solusiTerpilih.includes(idx) ? 'checked' : ''} onchange="window.pblManager.handlePhase4Check(${idx})">
                <span class="check-box-icon"></span>
                <span class="check-text">${sol}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="pbl-nav-footer">
          <button class="btn-pbl-secondary" onclick="window.pblManager.setPhase(3)">⬅ Kembali</button>
          <button class="btn-pbl-primary" onclick="window.pblManager.setPhase(5)">Lanjut ke Evaluasi & Refleksi ➔</button>
        </div>
      </div>
    `;
  }

  handlePhase4Check(idx) {
    if (this.answers.solusiTerpilih.includes(idx)) {
      this.answers.solusiTerpilih = this.answers.solusiTerpilih.filter(i => i !== idx);
    } else {
      this.answers.solusiTerpilih.push(idx);
    }
    if (window.audioMgr) window.audioMgr.playClickSound();
    this.renderPhaseView();
  }

  // FASE 5: EVALUASI & REFLEKSI (RUBRIK OTOMATIS)
  renderPhase5Evaluasi(caseData, container) {
    // Hitung Skor PBL Siswa
    let pblScore = 0;
    if (this.answers.masalah === caseData.fase.orientasi.kunci) pblScore += 25;
    if (this.answers.faktaTerpilih.length >= 3) pblScore += 25;
    if (this.answers.labPenyelidikan > 0) pblScore += 25;
    if (this.answers.solusiTerpilih.length >= 3) pblScore += 25;

    container.innerHTML = `
      <div class="pbl-card animate-fadeIn">
        <div class="pbl-task-box">
          <h4>🏆 Langkah 5: Evaluasi Hasil Investigasi PBL</h4>
          
          <div class="pbl-score-summary">
            <div class="pbl-score-circle">
              <span class="score-num">${pblScore}</span>
              <span class="score-label">/ 100 Poin</span>
            </div>
            <div class="pbl-score-info">
              <h5>Predikat: ${pblScore >= 75 ? '🌟 Sangat Memuaskan (Master Peneliti Cilik)' : '👍 Baik (Perlu Lengkapi Data)'}</h5>
              <p>Selamat! Kamu telah menyelesaikan seluruh siklus Problem-Based Learning sistem peredaran darah.</p>
            </div>
          </div>

          <!-- Lembar Refleksi Diri -->
          <div class="reflection-box">
            <label><strong>📝 Lembar Refleksi Siswa:</strong></label>
            <p class="reflection-prompt">${caseData.fase.evaluasi.pertanyaanRefleksi}</p>
            <textarea id="pbl-reflection-input" class="pbl-textarea" placeholder="Tuliskan kesimpulan dan pelajaran berharga yang kamu dapatkan di sini..." rows="4">${this.answers.refleksi}</textarea>
          </div>
        </div>

        <div class="pbl-nav-footer">
          <button class="btn-pbl-secondary" onclick="window.pblManager.setPhase(4)">⬅ Kembali</button>
          <button class="btn-pbl-primary" onclick="window.pblManager.downloadPBLReport(${pblScore})">
            📄 Unduh Laporan PBL (Cetak)
          </button>
        </div>
      </div>
    `;

    // Simpan progres pengerjaan PBL
    this.savePblProgress(this.currentCaseIndex, pblScore, this.answers.refleksi);

    const textarea = document.getElementById('pbl-reflection-input');
    if (textarea) {
      textarea.oninput = (e) => {
        this.answers.refleksi = e.target.value;
        this.savePblProgress(this.currentCaseIndex, pblScore, e.target.value);
      };
    }
  }

  savePblProgress(caseIdx, score, refleksi) {
    try {
      const existing = JSON.parse(localStorage.getItem('hematology_pbl_progress') || '{}');
      existing[`case_${caseIdx}`] = {
        caseIdx: caseIdx,
        score: score,
        refleksi: refleksi,
        date: new Date().toLocaleDateString('id-ID')
      };
      localStorage.setItem('hematology_pbl_progress', JSON.stringify(existing));

      // Rekam nilai PBL ke Buku Nilai Siswa di Dashboard Guru
      if (window.authMgr && typeof window.authMgr.updateStudentScore === 'function') {
        const studentName = window.authMgr.currentStudent ? window.authMgr.currentStudent.name : 'Meisya Ranny';
        const totalCompleted = Object.keys(existing).length;
        window.authMgr.updateStudentScore(studentName, {
          pblCount: totalCompleted,
          pblScore: score,
          pblRefleksi: refleksi
        });
      }

      if (window.updateDashboardStats) window.updateDashboardStats();
    } catch (e) {
      console.error('Gagal menyimpan progres PBL:', e);
    }
  }

  downloadPBLReport(score) {
    const caseData = CIRCULATORY_DATA.pblCases[this.currentCaseIndex];
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Asesmen PBL - Sistem Peredaran Darah</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #e63946; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 24px; font-weight: bold; color: #d90429; }
          .subtitle { font-size: 14px; color: #64748b; }
          .section { margin-bottom: 20px; }
          h3 { color: #3a86ff; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .score-box { background: #e0f2fe; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; }
          .refleksi { background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">LAPORAN ASESMEN PROBLEM-BASED LEARNING (PBL)</div>
          <div class="subtitle">Mata Pelajaran IPA Kelas VI SD - Sistem Peredaran Darah Manusia | Tanggal: ${today}</div>
        </div>

        <div class="section">
          <h3>1. Identitas Studi Kasus</h3>
          <p><strong>Judul Kasus:</strong> ${caseData.title}</p>
          <p><strong>Topik / Kategori:</strong> ${caseData.badge}</p>
        </div>

        <div class="section">
          <h3>2. Hasil Penyelidikan Ilmiah Siswa</h3>
          <div class="score-box">Skor Akhir Investigasi: ${score} / 100 Poin</div>
        </div>

        <div class="section">
          <h3>3. Catatan Refleksi Siswa</h3>
          <div class="refleksi">"${this.answers.refleksi || 'Sistem peredaran darah sangat penting untuk dijaga melalui makanan bergizi dan rutin berolahraga.'}"</div>
        </div>

        <div class="section" style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div>
            <p>Mengetahui,</p>
            <p style="margin-top: 60px;"><strong>( ${window.authMgr && window.authMgr.currentUser ? window.authMgr.currentUser.name : 'Guru Pengampu IPA'} )</strong></p>
          </div>
          <div style="text-align: right;">
            <p>Peserta Didik,</p>
            <p style="margin-top: 60px;"><strong>( ${window.authMgr && window.authMgr.currentStudent ? window.authMgr.currentStudent.name + ' - ' + window.authMgr.currentStudent.className : 'Siswa Kelas VI SD'} )</strong></p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

// Inisialisasi PBL Manager
window.pblManager = new PBLManager();
