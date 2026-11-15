import { OFFICES } from './data.js';
import { HQScene } from './scene.js';
import confetti from 'canvas-confetti';

// Audio Synthesizer via Web Audio API (zero external assets needed)
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (_) {}
  }

  playSwoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (_) {}
  }
}

const sfx = new SoundFX();

// DOM Elements
const canvasContainer = document.getElementById('canvas-container');
const roomNavBar = document.getElementById('room-nav-bar');
const resetCamBtn = document.getElementById('reset-cam-btn');
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');
const sideDrawer = document.getElementById('side-drawer');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const drawerBadge = document.getElementById('drawer-badge');
const drawerTitle = document.getElementById('drawer-title');
const drawerDesc = document.getElementById('drawer-desc');
const drawerAgentsList = document.getElementById('drawer-agents-list');
const openTgBtn = document.getElementById('open-tg-topic-btn');

let activeOfficeId = 'all';

// Initialize Three.js Scene
const hqScene = new HQScene(canvasContainer, OFFICES, (officeId) => {
  selectRoom(officeId);
});

// Select Room Handler
function selectRoom(officeId) {
  activeOfficeId = officeId;
  sfx.playSwoosh();

  // Update Toolbar active button
  const buttons = roomNavBar.querySelectorAll('.room-tab-btn');
  buttons.forEach((btn) => {
    if (btn.dataset.room === officeId) {
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      btn.classList.remove('active');
    }
  });

  // Focus 3D Camera
  hqScene.focusOffice(officeId);

  // Open Drawer if specific room
  if (officeId !== 'all') {
    const office = OFFICES.find((o) => o.id === officeId);
    if (office) {
      renderDrawer(office);
      sideDrawer.classList.add('open');
    }
  } else {
    sideDrawer.classList.remove('open');
  }
}

// Render Drawer Content
function renderDrawer(office) {
  drawerBadge.textContent = office.badge;
  drawerBadge.style.background = `${office.color}25`;
  drawerBadge.style.color = office.color;
  drawerBadge.style.borderColor = `${office.color}50`;

  drawerTitle.textContent = `${office.icon} ${office.name}`;
  drawerDesc.textContent = office.description;

  // Render Agents
  drawerAgentsList.innerHTML = office.agents
    .map(
      (agent) => `
    <div class="agent-card">
      <div class="agent-top">
        <div class="agent-name-wrap">
          <div class="agent-avatar-circle" style="background: ${agent.avatarColor};">
            ${agent.name[0]}
          </div>
          <div>
            <div class="agent-title">${agent.name}</div>
            <div class="agent-role">${agent.role}</div>
          </div>
        </div>
        <div class="agent-status-badge">
          ${agent.status}
        </div>
      </div>
      
      <ul class="agent-tasks-list">
        ${agent.tasks.map((task) => `<li>${task}</li>`).join('')}
      </ul>

      <div class="skills-tags">
        ${agent.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
    </div>
  `
    )
    .join('');

  // Configure Telegram button
  openTgBtn.onclick = () => {
    sfx.playClick();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.85 }
    });
    // Open Telegram Topic link
    window.open(`https://t.me/c/4333040438/${office.topicId}`, '_blank');
  };
}

// Toolbar Click Events
roomNavBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.room-tab-btn');
  if (!btn) return;
  sfx.playClick();
  const room = btn.dataset.room;
  selectRoom(room);
});

// Reset Camera Button
resetCamBtn.addEventListener('click', () => {
  sfx.playClick();
  selectRoom('all');
});

// Sound Toggle
soundBtn.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  soundIcon.textContent = sfx.enabled ? '🔊' : '🔇';
  if (sfx.enabled) sfx.playClick();
});

// Close Drawer
closeDrawerBtn.addEventListener('click', () => {
  sfx.playClick();
  sideDrawer.classList.remove('open');
  selectRoom('all');
});
