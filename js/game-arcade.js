/**
 * GAME ARCADE ENGINE - HEMOEXPLORER KELAS VI SD
 * Mode 1: HemoRunner (Ekspedisi Pembuluh Darah)
 * Mode 2: Pahlawan Leukosit (Immune Defense)
 */

class HemoArcadeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.mode = 'runner'; // 'runner' | 'defense'
    this.state = 'idle'; // 'idle' | 'playing' | 'paused' | 'gameover' | 'victory'

    // Responsive Canvas Resolution
    this.width = 800;
    this.height = 450;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game Variables
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.level = 1;
    this.lives = 3;
    this.maxLives = 3;
    this.oxygen = 100;
    this.combo = 0;
    this.gameTime = 0;
    this.distance = 0;
    this.targetDistance = 1500; // per stage

    // Player Object
    this.player = {
      x: 100,
      y: 225,
      radius: 22,
      vx: 0,
      vy: 0,
      speed: 5.5,
      shieldActive: false,
      shieldTimer: 0,
      angle: 0,
      pulseAnim: 0
    };

    // Game Entities
    this.items = [];
    this.obstacles = [];
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.bgCells = [];

    // Controls State
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      action: false
    };

    // Educational Tips Collection
    this.eduTips = [
      "Jantung manusia berdetak sekitar 100.000 kali setiap hari dan memompa lebih dari 7.000 liter darah!",
      "Sel darah merah (Eritrosit) memiliki hemoglobin yang bertugas mengikat Oksigen (O₂) dan mengantarkannya ke seluruh sel tubuh.",
      "Sel darah putih (Leukosit) adalah pahlawan tubuh kita yang membasmi bakteri, kuman, dan virus jahat!",
      "Keping darah (Trombosit) bekerja cepat membekukan darah dan menutup luka saat kulitmu tergores.",
      "Peredaran darah kecil mengalir dari Bilik Kanan ➔ Arteri Pulmonalis ➔ Paru-Paru ➔ Vena Pulmonalis ➔ Serambi Kiri.",
      "Peredaran darah besar mengalir dari Bilik Kiri ➔ Aorta ➔ Seluruh Tubuh ➔ Vena Cava ➔ Serambi Kanan.",
      "Olahraga teratur, banyak minum air putih, dan makan sayur buah menjaga pembuluh darahmu bebas dari plak kolesterol jahat!"
    ];

    this.initBackgroundBloodCells();
    this.initEventListeners();
    this.updateHUD();
    this.renderLeaderboard();
  }

  initBackgroundBloodCells() {
    this.bgCells = [];
    for (let i = 0; i < 35; i++) {
      this.bgCells.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 8 + 4,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.3 ? '#ff0054' : '#3a86ff'
      });
    }
  }

  initEventListeners() {
    // Keyboard Event Listeners
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) { this.keys.up = true; e.preventDefault(); }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { this.keys.down = true; e.preventDefault(); }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { this.keys.left = true; e.preventDefault(); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { this.keys.right = true; e.preventDefault(); }
      if (['Space', 'KeyJ'].includes(e.code)) {
        this.keys.action = true;
        this.triggerAction();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['Space', 'KeyJ'].includes(e.code)) this.keys.action = false;
    });

    // Touchpad / On-screen Buttons
    this.bindTouchButton('btn-touch-up', 'up');
    this.bindTouchButton('btn-touch-down', 'down');
    this.bindTouchButton('btn-touch-left', 'left');
    this.bindTouchButton('btn-touch-right', 'right');

    const actionBtn = document.getElementById('btn-touch-action');
    if (actionBtn) {
      const handleAction = (e) => {
        e.preventDefault();
        this.triggerAction();
      };
      actionBtn.addEventListener('mousedown', handleAction);
      actionBtn.addEventListener('touchstart', handleAction, { passive: false });
    }

    // Canvas Click / Tap for Mode 2 (Defense)
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * this.width;
      const clickY = ((e.clientY - rect.top) / rect.height) * this.height;

      if (this.mode === 'defense') {
        this.fireProjectile(clickX, clickY);
      } else {
        // Tap to move toward pointer smoothly in runner mode
        this.player.vy = clickY > this.player.y ? this.player.speed : -this.player.speed;
      }
    });
  }

  bindTouchButton(elemId, keyProp) {
    const btn = document.getElementById(elemId);
    if (!btn) return;

    const startHandler = (e) => {
      e.preventDefault();
      this.keys[keyProp] = true;
      btn.classList.add('pressed');
    };
    const endHandler = (e) => {
      e.preventDefault();
      this.keys[keyProp] = false;
      btn.classList.remove('pressed');
    };

    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
  }

  setGameMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;

    document.querySelectorAll('.game-mode-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gameMode === mode);
    });

    // Update touch action button label
    const actionBtn = document.getElementById('btn-touch-action');
    if (actionBtn) {
      if (mode === 'defense') {
        actionBtn.innerHTML = '<span>⚡ Tembak Antibodi</span>';
        actionBtn.classList.remove('btn-shield-action');
      } else {
        actionBtn.innerHTML = '<span>🛡️ Aktifkan Leukosit</span>';
        actionBtn.classList.add('btn-shield-action');
      }
    }

    this.showScreen('start');
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.level = 1;
    this.lives = this.maxLives;
    this.oxygen = 100;
    this.combo = 0;
    this.distance = 0;
    this.gameTime = 0;
    this.items = [];
    this.obstacles = [];
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];

    this.player.x = 100;
    this.player.y = this.height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.shieldActive = false;
    this.player.shieldTimer = 0;

    this.hideAllScreens();
    this.updateHUD();

    if (window.audioMgr) {
      window.audioMgr.playGameCollectSound(true);
    }

    this.lastFrameTime = performance.now();
    this.loop();
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.showScreen('pause');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.hideAllScreens();
      this.lastFrameTime = performance.now();
      this.loop();
    }
  }

  triggerAction() {
    if (this.state !== 'playing') return;

    if (this.mode === 'runner') {
      // Activate White Blood Cell shield if ready or has oxygen
      if (this.oxygen >= 25 && !this.player.shieldActive) {
        this.oxygen = Math.max(0, this.oxygen - 25);
        this.player.shieldActive = true;
        this.player.shieldTimer = 300; // 5 detik pada 60fps
        if (window.audioMgr) window.audioMgr.playGamePowerupSound();
        this.addFloatingText('🛡️ PERISAI LEUKOSIT!', this.player.x, this.player.y - 30, '#06d6a0');
      }
    } else if (this.mode === 'defense') {
      // Shoot straight
      this.fireProjectile(this.width, this.player.y);
    }
  }

  fireProjectile(targetX, targetY) {
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 10;

    this.projectiles.push({
      x: this.player.x + 15,
      y: this.player.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 7,
      color: '#38bdf8'
    });

    if (window.audioMgr) window.audioMgr.playGameLaserSound();

    // Muzzle flash particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.player.x + 20,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 4 + 2,
        color: '#93c5fd',
        life: 15
      });
    }
  }

  // --- GAME LOOP & UPDATE ---
  loop() {
    if (this.state !== 'playing') return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.gameTime++;
    this.distance += (this.level * 0.8 + 1.2);

    // Player Movement
    if (this.keys.up) this.player.vy = -this.player.speed;
    else if (this.keys.down) this.player.vy = this.player.speed;
    else this.player.vy *= 0.82; // damping

    if (this.keys.left) this.player.vx = -this.player.speed * 0.7;
    else if (this.keys.right) this.player.vx = this.player.speed * 0.7;
    else this.player.vx *= 0.82;

    this.player.x = Math.max(30, Math.min(this.width - 60, this.player.x + this.player.vx));
    this.player.y = Math.max(35, Math.min(this.height - 35, this.player.y + this.player.vy));
    this.player.pulseAnim += 0.08;

    // Shield Timer
    if (this.player.shieldActive) {
      this.player.shieldTimer--;
      if (this.player.shieldTimer <= 0) {
        this.player.shieldActive = false;
      }
    }

    // Oxygen Slow Decay in Runner mode (Need to pick up O2!)
    if (this.mode === 'runner' && this.gameTime % 45 === 0) {
      this.oxygen = Math.max(0, this.oxygen - 1);
      if (this.oxygen === 0 && this.gameTime % 90 === 0) {
        this.takeDamage(1, "Oksigen Habis!");
      }
    }

    // Spawning Items & Obstacles
    this.spawnEntities();

    // Update Projectiles (Mode 2)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Offscreen
      if (p.x > this.width || p.x < 0 || p.y > this.height || p.y < 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with obstacles/enemies
      for (let j = this.obstacles.length - 1; j >= 0; j--) {
        const obs = this.obstacles[j];
        if (Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius) {
          obs.hp--;
          this.createHitParticles(obs.x, obs.y, obs.color);
          this.projectiles.splice(i, 1);

          if (obs.hp <= 0) {
            this.obstacles.splice(j, 1);
            this.addScore(obs.points || 150);
            this.addFloatingText(`+${obs.points || 150}`, obs.x, obs.y, '#38bdf8');
            if (window.audioMgr) window.audioMgr.playGameCollectSound(true);
          }
          break;
        }
      }
    }

    // Update Items (Collectibles)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= item.speed;
      item.floatAnim += 0.05;

      // Check Collision with Player
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < this.player.radius + item.radius) {
        this.collectItem(item);
        this.items.splice(i, 1);
        continue;
      }

      if (item.x < -40) {
        this.items.splice(i, 1);
      }
    }

    // Update Obstacles & Enemies
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= obs.speed;
      if (obs.type === 'bacterium') {
        obs.y += Math.sin(this.gameTime * 0.05 + obs.offset) * 2;
      }

      // Check Collision with Player
      const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
      if (dist < this.player.radius + obs.radius) {
        if (this.player.shieldActive) {
          // Shield Destroys Obstacle
          this.createExplosionParticles(obs.x, obs.y, obs.color);
          this.obstacles.splice(i, 1);
          this.addScore(100);
          this.addFloatingText('🛡️ BASMI!', obs.x, obs.y, '#06d6a0');
          if (window.audioMgr) window.audioMgr.playGameCollectSound(true);
        } else {
          this.takeDamage(1, obs.name);
          this.createExplosionParticles(obs.x, obs.y, obs.color);
          this.obstacles.splice(i, 1);
        }
        continue;
      }

      if (obs.x < -50) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 1.2;
      t.life--;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Background Plasma Flow
    this.bgCells.forEach(cell => {
      cell.x -= cell.speed * (this.level * 0.5 + 0.8);
      if (cell.x < -20) {
        cell.x = this.width + 20;
        cell.y = Math.random() * this.height;
      }
    });

    // Check Level Progression (Runner Stage Clear)
    if (this.distance >= this.targetDistance) {
      if (this.level < 3) {
        this.levelUp();
      } else {
        this.victory();
      }
    }

    this.updateHUD();
  }

  spawnEntities() {
    const spawnRate = Math.max(35, 75 - this.level * 10);
    if (this.gameTime % spawnRate === 0) {
      const randY = Math.random() * (this.height - 100) + 50;

      if (this.mode === 'runner') {
        const typeRoll = Math.random();
        if (typeRoll < 0.45) {
          // Oxygen Bubble
          this.items.push({
            type: 'oxygen',
            name: 'Gas Oksigen (O₂)',
            icon: '🔵',
            x: this.width + 30,
            y: randY,
            radius: 16,
            speed: 3 + this.level * 0.5,
            color: '#38bdf8',
            floatAnim: 0,
            points: 100,
            oxyBoost: 20
          });
        } else if (typeRoll < 0.65) {
          // Nutrient
          this.items.push({
            type: 'nutrient',
            name: 'Nutrisi & Glukosa',
            icon: '🍎',
            x: this.width + 30,
            y: randY,
            radius: 15,
            speed: 3.2 + this.level * 0.5,
            color: '#fbbf24',
            floatAnim: 0,
            points: 50,
            lifeBoost: true
          });
        } else if (typeRoll < 0.75) {
          // White Blood Cell Power-Up
          this.items.push({
            type: 'shield',
            name: 'Perisai Leukosit',
            icon: '🛡️',
            x: this.width + 30,
            y: randY,
            radius: 18,
            speed: 3.5,
            color: '#06d6a0',
            floatAnim: 0,
            points: 150,
            isPowerup: true
          });
        } else if (typeRoll < 0.90) {
          // Cholesterol Plaque Obstacle
          this.obstacles.push({
            type: 'plaque',
            name: 'Plak Kolesterol',
            icon: '🟡',
            x: this.width + 40,
            y: randY,
            radius: 20,
            speed: 2.8 + this.level * 0.4,
            color: '#eab308',
            hp: 1,
            points: 80
          });
        } else {
          // Bacterium Enemy
          this.obstacles.push({
            type: 'bacterium',
            name: 'Bakteri Patogen',
            icon: '🦠',
            x: this.width + 40,
            y: randY,
            radius: 22,
            speed: 3.5 + this.level * 0.5,
            color: '#22c55e',
            offset: Math.random() * 10,
            hp: 2,
            points: 150
          });
        }
      } else {
        // Mode 2: Immune Defense - Spawning Waves of Pathogens
        const isBoss = Math.random() < 0.15;
        this.obstacles.push({
          type: isBoss ? 'virus_boss' : 'bacterium',
          name: isBoss ? 'Virus Berbahaya' : 'Bakteri Infeksi',
          icon: isBoss ? '👾' : '🦠',
          x: this.width + 40,
          y: randY,
          radius: isBoss ? 28 : 20,
          speed: isBoss ? 1.8 : 2.6 + this.level * 0.4,
          color: isBoss ? '#a855f7' : '#22c55e',
          offset: Math.random() * 10,
          hp: isBoss ? 3 : 1,
          points: isBoss ? 300 : 150
        });
      }
    }
  }

  collectItem(item) {
    this.addScore(item.points);
    this.combo++;

    if (item.type === 'oxygen') {
      this.oxygen = Math.min(100, this.oxygen + item.oxyBoost);
      this.addFloatingText(`+${item.points} O₂`, item.x, item.y, '#38bdf8');
      if (window.audioMgr) window.audioMgr.playGameCollectSound(false);
    } else if (item.type === 'nutrient') {
      if (this.lives < this.maxLives && Math.random() < 0.3) {
        this.lives++;
        this.addFloatingText('❤️ +1 Nyawa!', item.x, item.y, '#ef4444');
      } else {
        this.addFloatingText(`+${item.points}`, item.x, item.y, '#fbbf24');
      }
      if (window.audioMgr) window.audioMgr.playGameCollectSound(false);
    } else if (item.type === 'shield') {
      this.player.shieldActive = true;
      this.player.shieldTimer = 360; // 6 detik
      this.addFloatingText('🛡️ SUPER LEUKOSIT!', item.x, item.y, '#06d6a0');
      if (window.audioMgr) window.audioMgr.playGamePowerupSound();
    }

    // Particle Burst
    this.createHitParticles(item.x, item.y, item.color);
  }

  takeDamage(amount, sourceName = '') {
    this.lives -= amount;
    this.combo = 0;
    this.player.shieldActive = true;
    this.player.shieldTimer = 60; // 1s invulnerability flash

    if (window.audioMgr) window.audioMgr.playGameHitSound();
    this.addFloatingText(`💔 Terbentur ${sourceName}!`, this.player.x, this.player.y - 20, '#ef4444');

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  addScore(pts) {
    const multiplier = 1 + (this.level - 1) * 0.2 + (this.combo > 5 ? 0.3 : 0);
    const added = Math.round(pts * multiplier);
    this.score += added;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore(this.highScore);
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({ text, x, y, color, life: 40 });
  }

  createHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 3 + 2,
        color,
        life: 20
      });
    }
  }

  createExplosionParticles(x, y, color) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        radius: Math.random() * 5 + 3,
        color,
        life: 30
      });
    }
  }

  levelUp() {
    this.level++;
    this.targetDistance += 1500;
    this.addFloatingText(`🎉 LEVEL ${this.level}! SIRKULASI MAKIN CEPAT!`, this.width / 2 - 120, 100, '#ffbe0b');
    if (window.audioMgr) window.audioMgr.playFanfareSound();
  }

  victory() {
    this.state = 'victory';
    this.addScore(1000); // Victory bonus
    if (window.audioMgr) window.audioMgr.playGameWinSound();
    this.saveGameResult(true);
    this.showScreen('victory');
  }

  gameOver() {
    this.state = 'gameover';
    if (window.audioMgr) window.audioMgr.playGameOverSound();
    this.saveGameResult(false);
    this.showScreen('gameover');
  }

  // --- RENDERING ---
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Blood Vessel Walls & Background Gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#450a0a'); // Red vessel wall top
    bgGrad.addColorStop(0.15, '#1e0505');
    bgGrad.addColorStop(0.5, '#0f172a'); // Plasma stream center
    bgGrad.addColorStop(0.85, '#1e0505');
    bgGrad.addColorStop(1, '#450a0a'); // Red vessel wall bottom
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Flowing Vessel Borders with Ripples
    this.ctx.fillStyle = 'rgba(255, 0, 84, 0.25)';
    this.ctx.fillRect(0, 0, this.width, 14);
    this.ctx.fillRect(0, this.height - 14, this.width, 14);

    // 2. Background Blood Cells (Plasma Flow)
    this.bgCells.forEach(cell => {
      this.ctx.beginPath();
      this.ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = cell.color;
      this.ctx.globalAlpha = cell.opacity;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });

    // 3. Render Collectible Items
    this.items.forEach(item => {
      this.ctx.save();
      this.ctx.translate(item.x, item.y + Math.sin(item.floatAnim) * 5);

      // Glowing aura
      this.ctx.beginPath();
      this.ctx.arc(0, 0, item.radius + 6, 0, Math.PI * 2);
      this.ctx.fillStyle = item.color;
      this.ctx.globalAlpha = 0.35;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      // Icon
      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.icon, 0, 0);

      this.ctx.restore();
    });

    // 4. Render Obstacles & Enemies
    this.obstacles.forEach(obs => {
      this.ctx.save();
      this.ctx.translate(obs.x, obs.y);

      // Glowing Hazard Aura
      this.ctx.beginPath();
      this.ctx.arc(0, 0, obs.radius + 4, 0, Math.PI * 2);
      this.ctx.fillStyle = obs.color;
      this.ctx.globalAlpha = 0.3;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      // Icon
      this.ctx.font = obs.type === 'virus_boss' ? '30px sans-serif' : '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(obs.icon, 0, 0);

      // HP bar for multi-hit enemies
      if (obs.hp > 1) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(-15, -obs.radius - 12, 30, 5);
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(-15, -obs.radius - 12, (obs.hp / 3) * 30, 5);
      }

      this.ctx.restore();
    });

    // 5. Render Projectiles (Mode 2)
    this.projectiles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // 6. Render Particles
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life / 30);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });

    // 7. Render Player Character
    this.renderPlayer();

    // 8. Render Floating Texts
    this.floatingTexts.forEach(t => {
      this.ctx.font = 'bold 15px "Fredoka", sans-serif';
      this.ctx.fillStyle = t.color;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.shadowBlur = 0;
    });
  }

  renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Shield Aura if active
    if (this.player.shieldActive) {
      const shieldGlow = this.ctx.createRadialGradient(0, 0, 15, 0, 0, this.player.radius + 18);
      shieldGlow.addColorStop(0, 'rgba(6, 214, 160, 0)');
      shieldGlow.addColorStop(0.8, 'rgba(6, 214, 160, 0.45)');
      shieldGlow.addColorStop(1, 'rgba(56, 189, 248, 0.8)');
      this.ctx.fillStyle = shieldGlow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 16 + Math.sin(this.player.pulseAnim * 2) * 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#06d6a0';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    }

    if (this.mode === 'runner') {
      // Red Blood Cell (Erythrocyte) Body
      const scale = 1 + Math.sin(this.player.pulseAnim) * 0.05;
      this.ctx.scale(scale, scale);

      // Outer Red Cell
      const cellGrad = this.ctx.createRadialGradient(-4, -4, 2, 0, 0, this.player.radius);
      cellGrad.addColorStop(0, '#ff4d6d');
      cellGrad.addColorStop(0.7, '#c9184a');
      cellGrad.addColorStop(1, '#800f2f');

      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = cellGrad;
      this.ctx.shadowColor = '#ff0054';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Biconcave Center Dimple
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fillStyle = '#590d22';
      this.ctx.fill();

      // Cute Face Eyes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(5, -6, 4, 0, Math.PI * 2);
      this.ctx.arc(5, 6, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(6, -6, 2, 0, Math.PI * 2);
      this.ctx.arc(6, 6, 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Stethoscope / Doctor Hat Badge
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText('🩺', -14, -10);

    } else {
      // White Blood Cell (Leukocyte) Hero
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 14;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.font = '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🛡️', 0, 0);
    }

    this.ctx.restore();
  }

  // --- HUD & SCREENS ---
  updateHUD() {
    const elScore = document.getElementById('game-hud-score');
    const elLives = document.getElementById('game-hud-lives');
    const elOxy = document.getElementById('game-hud-oxygen');
    const elLevel = document.getElementById('game-hud-level');
    const elHigh = document.getElementById('game-hud-high');

    if (elScore) elScore.textContent = this.score;
    if (elHigh) elHigh.textContent = this.highScore;
    if (elLevel) elLevel.textContent = `Tingkat ${this.level}`;
    if (elLives) elLives.textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, this.maxLives - this.lives));
    if (elOxy) elOxy.textContent = `${Math.round(this.oxygen)}%`;
  }

  showScreen(screenName) {
    this.hideAllScreens();
    const screenEl = document.getElementById(`game-screen-${screenName}`);
    if (screenEl) {
      screenEl.style.display = 'flex';

      // Random educational tip
      const tipEl = screenEl.querySelector('.game-edu-tip-text');
      if (tipEl) {
        const randTip = this.eduTips[Math.floor(Math.random() * this.eduTips.length)];
        tipEl.textContent = randTip;
      }

      // Update final score display
      if (screenName === 'gameover' || screenName === 'victory') {
        const finalScoreEl = screenEl.querySelector('.game-final-score-val');
        if (finalScoreEl) finalScoreEl.textContent = this.score;
      }
    }
  }

  hideAllScreens() {
    document.querySelectorAll('.game-overlay-screen').forEach(el => {
      el.style.display = 'none';
    });
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('hemo_game_high_score') || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  saveHighScore(score) {
    try {
      localStorage.setItem('hemo_game_high_score', score.toString());
      this.renderLeaderboard();
    } catch (e) {}
  }

  saveGameResult(isWin) {
    try {
      const student = window.authMgr && window.authMgr.currentStudent ? window.authMgr.currentStudent.name : 'Siswa Tamu';
      const history = JSON.parse(localStorage.getItem('hemo_game_history') || '[]');
      history.unshift({
        name: student,
        score: this.score,
        mode: this.mode === 'runner' ? 'HemoRunner' : 'Pahlawan Leukosit',
        level: this.level,
        isWin,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      });
      if (history.length > 10) history.pop();
      localStorage.setItem('hemo_game_history', JSON.stringify(history));
      this.renderLeaderboard();

    } catch (e) {}
  }

  renderLeaderboard() {
    const listEl = document.getElementById('game-high-score-list');
    if (!listEl) return;

    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('hemo_game_history') || '[]');
    } catch (e) {}

    // Default mock data if empty
    if (history.length === 0) {
      history = [
        { name: 'Dr. Hemi (Juara)', score: 1850, mode: 'HemoRunner', level: 3 },
        { name: 'Ahmad Fauzi (6A)', score: 1420, mode: 'HemoRunner', level: 2 },
        { name: 'Siti Rahma (6B)', score: 1180, mode: 'Pahlawan Leukosit', level: 2 }
      ];
    }

    listEl.innerHTML = history.slice(0, 5).map((item, idx) => `
      <div class="high-score-row ${idx === 0 ? 'rank-1' : ''}">
        <div style="display: flex; align-items: center;">
          <span class="rank-badge">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
          <span class="player-name">${item.name}</span>
          <small style="margin-left: 8px; color: var(--text-muted); font-size: 0.78rem;">(${item.mode || 'Runner'})</small>
        </div>
        <span class="player-score">${item.score} Poin</span>
      </div>
    `).join('');
  }
}

// Global instance initialization helper
window.initHemoArcade = function() {
  if (!window.hemoGame) {
    window.hemoGame = new HemoArcadeGame('hemo-game-canvas');
  }
};
