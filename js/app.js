/**
 * APP MAIN CONTROLLER - SISTEM PEREDARAN DARAH KELAS VI SD
 * Pengatur Navigasi, Interaksi Komponen, Mikroskop Virtual, & Kalkulator Nadi
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Autentikasi & Dashboard
  if (window.authMgr) {
    window.authMgr.updateUI();
  }
  if (window.dashboardMgr) {
    window.dashboardMgr.init();
  }

  // Inisialisasi Komponen Utama
  initCombinedHome();
  initMobileNavigationPortal();
  initNavigation();
  initAccessibility();
  initBackgroundParticles();
  initComponentViews();
  initDisordersView();
  initVirtualMicroscope();
  updateDashboardStats();

  // Inisialisasi simulator 3D saat tab peredaran aktif
  if (window.Circulation3DSimulator) {
    window.sim3D = new Circulation3DSimulator('circulation-3d-canvas-container');
  }

  // Inisialisasi Quiz Alur Peredaran Darah
  if (window.quizEngine) {
    window.quizEngine.startQuiz('kecil');
  }

  // Inisialisasi PBL
  if (window.pblManager) {
    window.pblManager.init();
  }
});

function initCombinedHome() {
  const roles = document.querySelector('#view-portal .portal-roles-grid');
  const slot = document.getElementById('home-access-slot');
  if (roles && slot) slot.appendChild(roles);
}

function initMobileNavigationPortal() {
  const navbar = document.querySelector('.app-navbar');
  const menu = navbar?.querySelector('.nav-menu-wrapper');
  if (!navbar || !menu) return;

  const anchor = document.createComment('mobile-navigation-anchor');
  menu.parentNode.insertBefore(anchor, menu);
  const mobileQuery = window.matchMedia('(max-width: 768px)');

  const placeMenu = event => {
    const isMobile = event?.matches ?? mobileQuery.matches;
    if (isMobile && menu.parentNode !== document.body) {
      document.body.appendChild(menu);
      menu.classList.add('mobile-nav-portal');
    } else if (!isMobile && menu.parentNode === document.body) {
      anchor.parentNode.insertBefore(menu, anchor.nextSibling);
      menu.classList.remove('mobile-nav-portal');
    }
  };

  placeMenu();
  mobileQuery.addEventListener?.('change', placeMenu);
}

function initAccessibility() {
  document.querySelectorAll('[role="button"][tabindex="0"]').forEach(element => {
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        element.click();
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.app-modal-backdrop').forEach(modal => {
      if (modal.style.display !== 'none') modal.style.display = 'none';
    });
  });
}

// 1. ROUTER & NAVIGASI HALAMAN
function initNavigation() {
  const navButtons = document.querySelectorAll('[data-target-view]');
  const views = document.querySelectorAll('.app-view-section');

  const switchView = (targetViewId) => {
    if (window.audioMgr) window.audioMgr.playClickSound();
    const requestedViewId = targetViewId;
    if (targetViewId === 'view-portal') targetViewId = 'view-beranda';

    // Cek otentikasi jika ingin mengakses dashboard
    if (targetViewId === 'view-dashboard') {
      if (!window.authMgr || !window.authMgr.isLoggedIn()) {
        if (window.authMgr) {
          window.authMgr.openLoginModal('🔒 Halaman Dashboard khusus Guru. Silakan login dengan akun Guru (Username & Password) untuk mengakses rekapitulasi nilai kelas.');
        }
        return;
      } else {
        if (window.dashboardMgr) {
          window.dashboardMgr.renderDashboard();
        }
      }
    }

    views.forEach(v => {
      v.classList.remove('active-view');
      if (v.id === targetViewId) {
        v.classList.add('active-view');
      }
    });

    document.querySelectorAll('.nav-item-btn[data-target-view]').forEach(btn => {
      btn.classList.toggle('active-nav', btn.dataset.targetView === requestedViewId);
    });
    const moreMenu = document.querySelector('.nav-more-menu');
    if (moreMenu) {
      const primaryNavButtons = [...document.querySelectorAll('.nav-links > li > .nav-item-btn')];
      const hasActiveChild = [...moreMenu.querySelectorAll('.nav-item-btn.active-nav')].some(btn => {
        if (!btn.classList.contains('mobile-only-nav')) return true;

        const primaryButton = primaryNavButtons.find(primary => primary.dataset.targetView === btn.dataset.targetView);
        return !primaryButton || getComputedStyle(primaryButton.closest('li')).display === 'none';
      });
      moreMenu.classList.toggle('has-active-child', hasActiveChild);
      moreMenu.open = false;
    }

    // Handle khusus jika masuk ke tab 3D
    if (targetViewId === 'view-peredaran-3d' && window.sim3D) {
      setTimeout(() => {
        window.sim3D.handleResize();
      }, 100);
    }

    // Handle khusus jika masuk ke tab Latihan Alur
    if (targetViewId === 'view-quiz' && window.quizEngine) {
      if (!window.quizEngine.container || window.quizEngine.container.children.length === 0) {
        window.quizEngine.startQuiz(window.quizEngine.currentLevel || 'kecil');
      }
    }

    // Scroll ke atas dengan halus
    if (requestedViewId === 'view-portal') {
      document.getElementById('home-access-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.targetView;
      if (target) switchView(target);
    });
  });

  const moreMenu = document.querySelector('.nav-more-menu');
  document.addEventListener('click', event => {
    if (moreMenu && moreMenu.open && !moreMenu.contains(event.target)) moreMenu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && moreMenu) moreMenu.open = false;
  });

  // Global helper untuk tombol aksi CTA (e.g., dari beranda)
  window.navigateTo = (viewId) => {
    switchView(viewId);
  };
}

// 2. TAMPILAN MATERI KOMPONEN SISTEM PEREDARAN DARAH
function initComponentViews() {
  const tabs = document.querySelectorAll('.comp-subtab-btn');
  const subviews = document.querySelectorAll('.comp-subview');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (window.audioMgr) window.audioMgr.playClickSound();
      const targetSub = tab.dataset.subview;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      subviews.forEach(sv => {
        sv.classList.toggle('active', sv.id === targetSub);
      });
    });
  });

  // Render Anatomi 4 Ruang Jantung Interaktif dengan Gambar 3D & Tombol Detail serta Video YouTube Langsung
  const heartRuangContainer = document.getElementById('heart-chambers-grid');
  if (heartRuangContainer) {
    const j = CIRCULATORY_DATA.components.jantung;
    heartRuangContainer.innerHTML = j.ruang.map((r, idx) => `
      <div class="chamber-card" style="border-top-color: ${r.colorBadge}">
        <div class="card-3d-img-container" onclick="openVideoModal('${(r.videoUrl || '').replace(/'/g, "\\'")}', '${r.nama.replace(/'/g, "\\'")}', '${r.fungsi.replace(/'/g, "\\'")}')" title="Klik untuk putar video YouTube" style="cursor: pointer;">
          <img src="${r.image3d}" alt="${r.nama}" class="card-3d-preview-img" loading="lazy">
          <span class="badge-3d-pill" style="background: rgba(239, 68, 68, 0.95); color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">▶️ Video YouTube</span>
        </div>
        <div class="chamber-card-content">
          <div class="chamber-badge" style="background: ${r.colorBadge}">${r.sifatDarah}</div>
          <h4>${r.nama}</h4>
          <p class="chamber-desc"><strong>Tugas:</strong> ${r.fungsi}</p>
          <p class="chamber-valve">🚪 <strong>Katup:</strong> ${r.katup}</p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto; padding-top: 14px;">
            <button class="btn-cta-main" style="width: 100%; padding: 10px 14px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35); transition: transform 0.2s ease;" onclick="openVideoModal('${(r.videoUrl || '').replace(/'/g, "\\'")}', '${r.nama.replace(/'/g, "\\'")}', '${r.fungsi.replace(/'/g, "\\'")}')">
              <span>▶️ Tonton Video YouTube</span>
            </button>
            <button class="btn-card-detail-action" style="margin-top: 0; width: 100%;" onclick="openComponentDetail('jantung', ${idx})">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <path d="M11 8v6"/>
                <path d="M8 11h6"/>
              </svg>
              <span>Buka Detail & Suara 3D</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render Tabel Pembuluh Darah dengan Gambar 3D & Tombol Detail
  const vesselContainer = document.getElementById('vessels-cards-grid');
  if (vesselContainer) {
    const p = CIRCULATORY_DATA.components.pembuluh;
    vesselContainer.innerHTML = p.types.map((v, idx) => `
      <div class="vessel-detail-card" style="border-left: 6px solid ${v.badgeColor}">
        <div class="card-3d-img-container" onclick="openComponentDetail('pembuluh', ${idx})" title="Klik untuk perbesar dan lihat detail">
          <img src="${v.image3d}" alt="${v.nama}" class="card-3d-preview-img" loading="lazy">
          <span class="badge-3d-pill">✨ Struktur 3D</span>
        </div>
        <div class="vessel-card-header">
          <h3>${v.nama}</h3>
          <span class="vessel-badge" style="background: ${v.badgeColor}">${v.arah}</span>
        </div>
        <ul class="vessel-specs">
          <li><strong>Dinding:</strong> ${v.dinding}</li>
          <li><strong>Letak:</strong> ${v.letak}</li>
          <li><strong>Denyut:</strong> ${v.denyut}</li>
          <li><strong>Katup:</strong> ${v.katup}</li>
          <li><strong>Jika Luka:</strong> ${v.aliran}</li>
          <li><strong>Sifat Darah:</strong> ${v.isiDarah}</li>
        </ul>
        <button class="btn-card-detail-action" style="margin-top: 15px;" onclick="openComponentDetail('pembuluh', ${idx})">
          <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
          </svg>
          <span>Buka Detail & Suara 3D</span>
        </button>
      </div>
    `).join('');
  }

  // Render Komposisi Darah dengan Gambar 3D & Tombol Detail
  const bloodCompContainer = document.getElementById('blood-components-grid');
  if (bloodCompContainer) {
    const d = CIRCULATORY_DATA.components.darah;
    bloodCompContainer.innerHTML = d.components.map((c, idx) => `
      <div class="blood-item-card" style="border-top: 5px solid ${c.visualColor}">
        <div class="card-3d-img-container" style="margin-bottom: 12px;" onclick="openComponentDetail('darah', ${idx})" title="Klik untuk perbesar dan lihat detail">
          <img src="${c.image3d}" alt="${c.nama}" class="card-3d-preview-img" style="max-height: 140px;" loading="lazy">
        </div>
        <div class="blood-header-row">
          <div class="blood-icon-circle" style="background: ${c.visualColor}20; color: ${c.visualColor}">
            ${c.icon}
          </div>
          <h4>${c.nama}</h4>
        </div>
        <p><strong>Ciri Fisik:</strong> ${c.bentuk}</p>
        <p class="blood-duty"><strong>Fungsi:</strong> ${c.fungsi}</p>
        <button class="btn-card-detail-action" style="margin-top: 12px;" onclick="openComponentDetail('darah', ${idx})">
          <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
          </svg>
          <span>Buka Detail & Suara 3D</span>
        </button>
      </div>
    `).join('');
  }
}

// 2.1 POP UP MODAL DETAIL CARD
function openComponentDetail(type, index) {
  if (window.audioMgr) window.audioMgr.playClickSound();

  const modal = document.getElementById('component-detail-modal');
  const content = document.getElementById('modal-detail-dynamic-content');
  if (!modal || !content) return;

  let title = '';
  let badge = '';
  let badgeColor = '#ff0054';
  let imageSrc = '';
  let descriptionHtml = '';
  let speechText = '';

  if (type === 'jantung') {
    const item = CIRCULATORY_DATA.components.jantung.ruang[index];
    title = item.nama;
    badge = item.sifatDarah;
    badgeColor = item.colorBadge;
    imageSrc = item.image3d;
    const videoLink = item.videoUrl || 'https://www.youtube.com/watch?v=5tUWOF6wEnk';
    speechText = `${item.nama}. Lokasi: ${item.lokasi}. Fungsi utama: ${item.fungsi}. Sifat darah: ${item.sifatDarah}. Katup pelindung: ${item.katup}.`;
    
    descriptionHtml = `
      <div class="modal-detail-grid">
        <div class="modal-detail-img-wrap">
          <img src="${imageSrc}" alt="${title}" class="modal-detail-large-img">
          <span class="badge-3d-pill" style="top: 12px; right: 12px; bottom: auto;">✨ Model Anatomi 3D</span>
        </div>
        <div class="modal-detail-info-wrap">
          <div class="chamber-badge" style="background: ${badgeColor}; font-size: 0.85rem; padding: 6px 14px;">${badge}</div>
          <h2 style="font-family: var(--font-heading); margin: 10px 0 6px 0; color: var(--text-heading); font-size: 1.6rem;">${title}</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">📍 <strong>Posisi Ruang:</strong> ${item.lokasi}</p>

          <div class="modal-info-box">
            <h4>🎯 Tugas & Peran Utama</h4>
            <p>${item.fungsi}</p>
          </div>

          <div class="modal-info-box" style="margin-top: 12px;">
            <h4>🚪 Katup Pengaman</h4>
            <p>${item.katup}</p>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <button class="btn-cta-main" style="width: auto; padding: 10px 22px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); border-radius: 999px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;" onclick="openVideoModal('${videoLink.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${item.fungsi.replace(/'/g, "\\'")}')">
              <span>🎬 Tonton Video</span>
            </button>
            <button class="btn-cta-secondary" style="padding: 10px 20px;" onclick="closeComponentDetail()">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'pembuluh') {
    const item = CIRCULATORY_DATA.components.pembuluh.types[index];
    title = item.nama;
    badge = item.arah;
    badgeColor = item.badgeColor;
    imageSrc = item.image3d;
    const videoLink = item.videoUrl || 'https://www.youtube.com/watch?v=v43ej5lCeBo';
    speechText = `${item.nama}. Arah aliran: ${item.arah}. Ciri dinding: ${item.dinding}. Karakteristik denyut: ${item.denyut}. Sifat darah: ${item.isiDarah}.`;

    descriptionHtml = `
      <div class="modal-detail-grid">
        <div class="modal-detail-img-wrap">
          <img src="${imageSrc}" alt="${title}" class="modal-detail-large-img">
          <span class="badge-3d-pill" style="top: 12px; right: 12px; bottom: auto;">✨ Struktur Irisan 3D</span>
        </div>
        <div class="modal-detail-info-wrap">
          <div class="vessel-badge" style="background: ${badgeColor}; font-size: 0.85rem; padding: 6px 14px;">${badge}</div>
          <h2 style="font-family: var(--font-heading); margin: 10px 0 16px 0; color: var(--text-heading); font-size: 1.6rem;">${title}</h2>

          <ul class="vessel-specs" style="background: var(--bg-primary); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <li><strong>Dinding Saluran:</strong> ${item.dinding}</li>
            <li><strong>Letak di Tubuh:</strong> ${item.letak}</li>
            <li><strong>Denyut:</strong> ${item.denyut}</li>
            <li><strong>Jumlah Katup:</strong> ${item.katup}</li>
            <li><strong>Tekanan Saat Luka:</strong> ${item.aliran}</li>
            <li><strong>Muatan Gas Darah:</strong> ${item.isiDarah}</li>
          </ul>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <button class="btn-cta-main" style="width: auto; padding: 10px 22px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); border-radius: 999px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;" onclick="openVideoModal('${videoLink.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${item.arah.replace(/'/g, "\\'")}')">
              <span>🎬 Tonton Video</span>
            </button>
            <button class="btn-cta-secondary" style="padding: 10px 20px;" onclick="closeComponentDetail()">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'darah') {
    const item = CIRCULATORY_DATA.components.darah.components[index];
    title = item.nama;
    badge = "Komposisi Darah";
    badgeColor = item.visualColor;
    imageSrc = item.image3d;
    const videoLink = item.videoUrl || 'https://www.youtube.com/watch?v=CRh_dAzXuoU';
    speechText = `${item.nama}. Ciri fisik: ${item.bentuk}. Fungsi dalam tubuh: ${item.fungsi}.`;

    descriptionHtml = `
      <div class="modal-detail-grid">
        <div class="modal-detail-img-wrap">
          <img src="${imageSrc}" alt="${title}" class="modal-detail-large-img">
          <span class="badge-3d-pill" style="top: 12px; right: 12px; bottom: auto;">✨ Sel Darah 3D</span>
        </div>
        <div class="modal-detail-info-wrap">
          <div class="vessel-badge" style="background: ${badgeColor}; font-size: 0.85rem; padding: 6px 14px;">${badge}</div>
          <h2 style="font-family: var(--font-heading); margin: 10px 0 16px 0; color: var(--text-heading); font-size: 1.6rem;">${title}</h2>

          <div class="modal-info-box" style="margin-bottom: 14px;">
            <h4>🔍 Karakteristik & Ciri Fisik</h4>
            <p>${item.bentuk}</p>
          </div>

          <div class="modal-info-box" style="margin-bottom: 20px;">
            <h4>🛡️ Fungsi & Tugas Khusus</h4>
            <p>${item.fungsi}</p>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <button class="btn-cta-main" style="width: auto; padding: 10px 22px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); border-radius: 999px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;" onclick="openVideoModal('${videoLink.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${item.fungsi.replace(/'/g, "\\'")}')">
              <span>🎬 Tonton Video</span>
            </button>
            <button class="btn-cta-secondary" style="padding: 10px 20px;" onclick="closeComponentDetail()">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'gangguan') {
    const item = CIRCULATORY_DATA.disorders[index];
    title = item.nama;
    badge = `${item.faktorIcon} ${item.faktorKategori}`;
    badgeColor = item.faktorBadgeColor || item.color;
    speechText = `${item.nama}. Faktor pemicu: ${item.faktorKategori} bagian ${item.faktorJenis}. ${item.audioNarasi}`;

    descriptionHtml = `
      <div class="modal-detail-grid">
        <div class="modal-detail-img-wrap" style="background: radial-gradient(circle, ${item.color}25 0%, rgba(15,23,42,0.85) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 18px; text-align: center; border-radius: var(--radius-sm); min-height: 240px;">
          <div style="font-size: 5rem; margin-bottom: 12px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.35));">${item.icon}</div>
          <span class="badge-3d-pill" style="position: static; background: ${item.color}; color: #fff; font-size: 0.82rem; padding: 6px 14px; margin-top: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            ${item.faktorIcon} ${item.faktorKategori}
          </span>
          <div style="margin-top: 12px; font-size: 0.85rem; color: #e2e8f0; line-height: 1.4; max-width: 200px;">
            Fokus: <strong style="color: #fff;">${item.faktorJenis}</strong>
          </div>
        </div>
        <div class="modal-detail-info-wrap">
          <div class="chamber-badge" style="background: ${item.faktorBadgeColor}; font-size: 0.85rem; padding: 6px 14px;">${badge}</div>
          <h2 style="font-family: var(--font-heading); margin: 10px 0 14px 0; color: var(--text-heading); font-size: 1.55rem;">${title}</h2>

          <div class="modal-info-box" style="margin-bottom: 10px; border-left: 4px solid #3b82f6;">
            <h4 style="color: #3b82f6;">🩺 Gejala & Tanda Klinis</h4>
            <p>${item.gejala}</p>
          </div>

          <div class="modal-info-box" style="margin-bottom: 10px; border-left: 4px solid #ef4444;">
            <h4 style="color: #ef4444;">⚠️ Penyebab Penyakit</h4>
            <p>${item.penyebab}</p>
          </div>

          <div class="modal-info-box" style="margin-bottom: 10px; border-left: 4px solid ${item.faktorBadgeColor};">
            <h4 style="color: ${item.faktorBadgeColor};">🔬 Analisis Faktor Pemicu (${item.faktorJenis})</h4>
            <p>${item.faktorPenjelasan}</p>
          </div>

          <div class="modal-info-box" style="margin-bottom: 18px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981;">🛡️ Langkah Pencegahan & Solusi</h4>
            <p>${item.caraCegah}</p>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <button class="btn-cta-secondary" style="padding: 10px 26px;" onclick="closeComponentDetail()">
              Tutup Pop-up
            </button>
          </div>
        </div>
      </div>
    `;
  }

  content.innerHTML = descriptionHtml;
  modal.style.display = 'flex';
}

function closeComponentDetail() {
  if (window.audioMgr) {
    window.audioMgr.playClickSound();
    window.audioMgr.stopSpeech();
  }
  const modal = document.getElementById('component-detail-modal');
  if (modal) modal.style.display = 'none';
}

// 2.2 PEMUTAR VIDEO EDUKASI MODAL
function formatVideoEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();

  // Jika format sudah embed YouTube
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;

  // Format link YouTube standar (watch?v= atau youtu.be)
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&enablejsapi=1`;
  }

  // Google Drive preview URL
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view.*$/, '/preview');
  }

  return url;
}

function openVideoModal(videoUrl, title = 'Video Pembelajaran', subtitle = '') {
  if (window.audioMgr) {
    window.audioMgr.playClickSound();
    window.audioMgr.stopSpeech();
  }

  const modal = document.getElementById('video-player-modal');
  const titleEl = document.getElementById('video-modal-title');
  const subtitleEl = document.getElementById('video-modal-subtitle');
  const iframeEl = document.getElementById('video-modal-iframe');
  const nativeVideoEl = document.getElementById('video-modal-native');
  const ytBtn = document.getElementById('video-modal-yt-btn');

  if (!modal) return;

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (ytBtn) {
    ytBtn.href = videoUrl || 'https://youtu.be/UsbiPI85Bgs';
  }

  const formattedUrl = formatVideoEmbedUrl(videoUrl);
  const isDirectVideo = /\.(mp4|webm|ogg)($|\?)/i.test(videoUrl);

  if (isDirectVideo) {
    if (iframeEl) {
      iframeEl.style.display = 'none';
      iframeEl.src = '';
    }
    if (nativeVideoEl) {
      nativeVideoEl.style.display = 'block';
      nativeVideoEl.src = videoUrl;
      nativeVideoEl.play().catch(() => {});
    }
  } else {
    if (nativeVideoEl) {
      nativeVideoEl.pause();
      nativeVideoEl.style.display = 'none';
      nativeVideoEl.src = '';
    }
    if (iframeEl) {
      iframeEl.style.display = 'block';
      iframeEl.src = formattedUrl || 'https://www.youtube-nocookie.com/embed/UsbiPI85Bgs?autoplay=1&rel=0';
    }
  }

  modal.style.display = 'flex';
}

function closeVideoModal() {
  if (window.audioMgr) {
    window.audioMgr.playClickSound();
  }
  const modal = document.getElementById('video-player-modal');
  const iframeEl = document.getElementById('video-modal-iframe');
  const nativeVideoEl = document.getElementById('video-modal-native');

  if (iframeEl) iframeEl.src = '';
  if (nativeVideoEl) {
    nativeVideoEl.pause();
    nativeVideoEl.src = '';
  }
  if (modal) modal.style.display = 'none';
}

window.openComponentDetail = openComponentDetail;
window.closeComponentDetail = closeComponentDetail;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;

// 3. MIKROSKOP VIRTUAL INTERAKTIF
function initVirtualMicroscope() {
  const slider = document.getElementById('microscope-zoom-slider');
  const zoomDisplay = document.getElementById('microscope-zoom-label');
  const canvas = document.getElementById('microscope-canvas');
  if (!canvas || !slider) return;

  const ctx = canvas.getContext('2d');

  const drawBloodSlide = (zoomLevel) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Latar belakang cairan plasma kuning bening
    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efek lensa lingkaran mikroskop
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 170;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#fffae6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gambar Sel Darah Merah (Eritrosit) Bikonkaf
    const rbcSize = 10 * zoomLevel;
    const countRBC = Math.max(15, Math.floor(40 / zoomLevel));

    for (let i = 0; i < countRBC; i++) {
      const x = centerX + Math.cos(i * 1.3) * (radius - 30) * (i / countRBC);
      const y = centerY + Math.sin(i * 1.3) * (radius - 30) * (i / countRBC);

      // Cekungan donat eritrosit
      ctx.fillStyle = '#ef476f';
      ctx.beginPath();
      ctx.arc(x, y, rbcSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.arc(x, y, rbcSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gambar Sel Darah Putih (Leukosit) Berinti
    const wbcX = centerX - 40;
    const wbcY = centerY - 30;
    const wbcSize = 16 * zoomLevel;

    ctx.fillStyle = '#06d6a0';
    ctx.beginPath();
    ctx.arc(wbcX, wbcY, wbcSize, 0, Math.PI * 2);
    ctx.fill();

    // Inti sel ungu
    ctx.fillStyle = '#7209b7';
    ctx.beginPath();
    ctx.arc(wbcX - wbcSize * 0.2, wbcY, wbcSize * 0.35, 0, Math.PI * 2);
    ctx.arc(wbcX + wbcSize * 0.2, wbcY, wbcSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Gambar Keping Darah (Trombosit)
    ctx.fillStyle = '#118ab2';
    for (let j = 0; j < 8; j++) {
      const tx = centerX + Math.sin(j * 2) * 90;
      const ty = centerY + Math.cos(j * 2) * 90;
      ctx.fillRect(tx, ty, 4 * zoomLevel, 4 * zoomLevel);
    }

    ctx.restore();

    // Bingkai Lensa Mikroskop
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle Crosshair
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
  };

  slider.addEventListener('input', (e) => {
    const zoom = parseFloat(e.target.value);
    if (zoomDisplay) zoomDisplay.textContent = `${Math.round(zoom * 200)}x`;
    drawBloodSlide(zoom);
  });

  drawBloodSlide(1.0);
}


// 5. GANGGUAN SISTEM PEREDARAN DARAH DENGAN FAKTOR PENYEBAB & SUARA NARATOR
function initDisordersView() {
  const grid = document.getElementById('disorders-cards-grid');
  if (!grid) return;

  grid.innerHTML = CIRCULATORY_DATA.disorders.map((d, idx) => `
    <article class="disorder-card animate-card">
      <div>
        <div class="disorder-header">
          <button type="button" class="disorder-icon-badge" onclick="openComponentDetail('gangguan', ${idx})" aria-label="Lihat detail ${d.nama}"><svg class="themed-icon" aria-hidden="true"><use href="#ui-icon-heart"/></svg></button>
          <div class="disorder-title-group" onclick="openComponentDetail('gangguan', ${idx})" role="button" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openComponentDetail('gangguan', ${idx}); }">
            <h3>${d.nama}</h3>
            <span class="disorder-factor-pill">
              <svg class="ui-inline-icon" aria-hidden="true"><use href="#ui-icon-info"/></svg>${d.faktorKategori}
            </span>
          </div>
        </div>

        <div class="disorder-body">
          <p><strong>🩺 Gejala:</strong> ${d.gejala}</p>
          <p><strong>⚠️ Penyebab:</strong> ${d.penyebab}</p>
          <p class="disorder-prevention"><strong>🛡️ Pencegahan:</strong> ${d.caraCegah}</p>
        </div>
      </div>

      <!-- INFO FAKTOR PENYEBAB GANGGUAN (KLIK UNTUK POP UP DETAIL) -->
      <div class="disorder-factor-card-footer">
        <div class="disorder-factor-clickable-box" onclick="openComponentDetail('gangguan', ${idx})" style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-left: 4px solid ${d.faktorBadgeColor}; border-radius: var(--radius-sm); padding: 10px 14px; cursor: pointer; transition: all 0.2s ease;" title="Klik untuk membuka Pop-up Detail Medis & Edukasi">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; flex-wrap: wrap; gap: 4px;">
            <span style="font-size: 0.78rem; font-weight: 700; color: ${d.faktorBadgeColor}; text-transform: uppercase; letter-spacing: 0.3px;">
              ${d.faktorIcon} Faktor: ${d.faktorJenis}
            </span>
            <span style="font-size: 0.72rem; font-weight: 700; color: ${d.faktorBadgeColor}; background: ${d.faktorBadgeBg}; padding: 1px 8px; border-radius: 999px;">
              ${d.faktorKategori}
            </span>
          </div>
          <p style="font-size: 0.84rem; color: var(--text-main); margin: 0 0 6px 0; line-height: 1.45;">
            ${d.faktorPenjelasan}
          </p>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: var(--cardiac-blue); font-size: 0.76rem; font-weight: 700;">
            <span>🔍 Klik untuk Pop-up Detail</span>
            <span>➔</span>
          </div>
        </div>

        <button class="btn-card-detail-action" style="margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;" onclick="openComponentDetail('gangguan', ${idx})">
          <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
          </svg>
          <span>Buka Pop-up Detail Medis</span>
        </button>
      </div>
    </article>
  `).join('');
}

// 6. UPDATE DASHBOARD STATS DI BERANDA & DASHBOARD
function updateDashboardStats() {
  try {
    const progress = JSON.parse(localStorage.getItem('hematology_quiz_progress') || '{}');
    const badge1 = document.getElementById('dash-badge-mudah');
    const badge2 = document.getElementById('dash-badge-sedang');
    const badge3 = document.getElementById('dash-badge-sulit');

    const scoreMudah = progress.mudah || progress.kecil;
    const scoreSedang = progress.sedang || progress.besar;
    const scoreSulit = progress.sulit || progress.gabungan;

    if (badge1 && scoreMudah) {
      badge1.textContent = `Tuntas (${scoreMudah.score}/100)`;
      badge1.className = 'dash-badge completed';
    }
    if (badge2 && scoreSedang) {
      badge2.textContent = `Tuntas (${scoreSedang.score}/100)`;
      badge2.className = 'dash-badge completed';
    }
    if (badge3 && scoreSulit) {
      badge3.textContent = `Tuntas (${scoreSulit.score}/100)`;
      badge3.className = 'dash-badge completed';
    }

    if (window.dashboardMgr && window.authMgr && window.authMgr.isLoggedIn()) {
      window.dashboardMgr.renderDashboard();
    }
  } catch (e) {}
}
window.updateDashboardStats = updateDashboardStats;

// 7. BACKGROUND FLOATING BLOOD PARTICLES CANVAS
function initBackgroundParticles() {
  const canvas = document.getElementById('bg-particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const cells = [];
  for (let i = 0; i < 25; i++) {
    cells.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 8 + 6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? 'rgba(239, 71, 111, 0.15)' : 'rgba(58, 134, 255, 0.12)'
    });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    cells.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;

      if (c.y > height + 20) {
        c.y = -20;
        c.x = Math.random() * width;
      }
      if (c.x < -20) c.x = width + 20;
      if (c.x > width + 20) c.x = -20;

      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }
  loop();
}
