import { ACTS } from '../../shared/levels.js';
import { ROLES, POWERS, MSG, INVULN_DURATION } from '../../shared/constants.js';
import {
  createWorldState,
  castPower,
  triggerHarmony,
  collectShard,
  touchCheckpoint,
  recordDamage,
  checkPartnerReviveOverlap,
  stepWorld,
  isPortalUnlocked,
} from '../../shared/worldSimulation.js';
import { AudioEngine } from './audio.js';
import { InputManager } from './input.js';
import { ParticleSystem } from './particles.js';
import { GameRenderer } from './renderer.js';
import { GameNetwork } from './network.js';
import {
  createPlayerEntity,
  stepPlayerPhysics,
  updateScarf,
  computeAiCompanionInput,
} from './physics.js';

const $ = (id) => document.getElementById(id);

const ui = {
  canvas: $('game-canvas'),
  portraitBanner: $('portrait-banner'),
  btnDismissPortrait: $('btn-dismiss-portrait'),
  screenTitle: $('screen-title'),
  inputPlayerName: $('input-player-name'),
  btnCreateRoom: $('btn-create-room'),
  btnToggleJoin: $('btn-toggle-join'),
  joinPanel: $('join-panel'),
  inputRoomCode: $('input-room-code'),
  btnJoinRoom: $('btn-join-room'),
  selectSoloAct: $('select-solo-act'),
  btnSoloMode: $('btn-solo-mode'),
  btnOpenTutorial: $('btn-open-tutorial'),
  titleError: $('title-error'),

  screenTutorial: $('screen-tutorial'),
  tutorialSlideBody: $('tutorial-slide-body'),
  tutorialDots: $('tutorial-dots'),
  btnTutPrev: $('btn-tut-prev'),
  btnTutNext: $('btn-tut-next'),
  btnTutSkip: $('btn-tut-skip'),

  screenLobby: $('screen-lobby'),
  lobbyCode: $('lobby-code'),
  lobbyQr: $('lobby-qr'),
  btnCopyLink: $('btn-copy-link'),
  lobbyUrlText: $('lobby-url-text'),
  cardSola: $('card-sola'),
  cardLuna: $('card-luna'),
  slotSolaPlayer: $('slot-sola-player'),
  slotLunaPlayer: $('slot-luna-player'),
  selectLobbyAct: $('select-lobby-act'),
  btnSwapRole: $('btn-swap-role'),
  btnStartGame: $('btn-start-game'),
  btnLeaveLobby: $('btn-leave-lobby'),
  lobbyHint: $('lobby-hint'),

  gameHud: $('game-hud'),
  hudHpSola: $('hud-hp-sola'),
  hudHpLuna: $('hud-hp-luna'),
  hudShards: $('hud-shards'),
  hudActName: $('hud-act-name'),
  btnSoloSwitch: $('btn-solo-switch'),
  btnHint: $('btn-hint'),
  hudNetStatus: $('hud-net-status'),
  btnMute: $('btn-mute'),
  btnMenu: $('btn-menu'),
  tutorialChecklist: $('tutorial-checklist'),
  chkMove: $('chk-move'),
  chkBriar: $('chk-briar'),
  chkBridge: $('chk-bridge'),
  chkGate: $('chk-gate'),
  hintCard: $('hint-card'),
  hintStageTitle: $('hint-stage-title'),
  hintCounter: $('hint-counter'),
  hintObjective: $('hint-objective'),
  hintText: $('hint-text'),
  btnHintNext: $('btn-hint-next'),
  btnHintClose: $('btn-hint-close'),
  bossHud: $('boss-hud'),
  bossName: $('boss-name'),
  bossWeaknessBadge: $('boss-weakness-badge'),
  bossBarFill: $('boss-bar-fill'),
  hudToast: $('hud-toast'),

  joyZone: $('joy-zone'),
  joyKnob: $('joy-knob'),
  btnJump: $('btn-jump'),
  btnPower: $('btn-power'),
  btnPowerLabel: $('btn-power-label'),
  powerCooldownRing: $('power-cooldown-ring'),
  btnHarmony: $('btn-harmony'),
  btnEmote: $('btn-emote'),

  actCurtain: $('act-curtain'),
  curtainTitle: $('curtain-title'),
  curtainSubtitle: $('curtain-subtitle'),

  screenPause: $('screen-pause'),
  pauseRoomInfo: $('pause-room-info'),
  selectPauseAct: $('select-pause-act'),
  btnJumpAct: $('btn-jump-act'),
  sliderBgm: $('slider-bgm'),
  sliderSfx: $('slider-sfx'),
  btnResume: $('btn-resume'),
  btnPauseTutorial: $('btn-pause-tutorial'),
  btnRestartAct: $('btn-restart-act'),
  btnExitHome: $('btn-exit-home'),

  screenVictory: $('screen-victory'),
  vicShards: $('vic-shards'),
  vicTeamwork: $('vic-teamwork'),
  vicTime: $('vic-time'),
  btnPlayAgain: $('btn-play-again'),
  btnVictoryHome: $('btn-victory-home'),
};

const audio = new AudioEngine();
const input = new InputManager();
const particles = new ParticleSystem();
const renderer = new GameRenderer(ui.canvas);
const net = new GameNetwork();

const state = {
  mode: 'title', // 'title' | 'lobby' | 'playing' | 'paused' | 'victory'
  isSolo: false,
  localRole: 'sola',
  world: createWorldState(0),
  players: {
    sola: createPlayerEntity('sola', ACTS[0].spawns.sola),
    luna: createPlayerEntity('luna', ACTS[0].spawns.luna),
  },
  partnerTarget: null,
  aiState: { jumpCooldown: 0, castCooldown: 0 },
  emotes: [],
  shownHints: new Set(),
  toastTimer: 0,
  localCooldownUntil: 0,
  harmonyCooldownUntil: 0,
  shardCombo: 0,
  shardComboTimer: 0,
  lastStateSendAt: 0,
  portalRequestSent: false,
  bossMusicTriggered: false,
  portraitDismissed: false,
  inviteUrl: '',
  tutorialSlide: 0,
  tutorialReturnMode: 'title',
  hintIndex: 0,
  hintOpen: false,
  tutChecklist: { move: false, briar: false, bridge: false, gate: false },
  lastProgressTime: 0,
  lastProgressX: 0,
  stuckHintShown: false,
};

const TUTORIAL_SLIDES = [
  {
    title: '1/4 · บทบาทคู่หู SOLA และ LUNA',
    html: `
      <h3>พลังแสงคู่ที่ต้องพึ่งพากัน</h3>
      <ul>
        <li><span class="tut-pill-sola">SOLA (โซลา · ตะวัน)</span> — ยิง<strong>ลำแสงสุริยะ</strong> เผาเถาวัลย์เงา จุดเสาสุริยันสีทอง</li>
        <li><span class="tut-pill-luna">LUNA (ลูนา · จันทรา)</span> — ยิง<strong>คลื่นจันทรา</strong> กระตุ้นผลึกสีฟ้า เสกสะพานแสง และแช่แข็งศัตรูชั่วคราว</li>
        <li>ทั้งสองพลังต้องร่วมมือกันเพื่อเปิดประตูโบราณในแต่ละด่าน</li>
      </ul>`,
  },
  {
    title: '2/4 · การควบคุมมือถือ & คีย์บอร์ด',
    html: `
      <h3>คุมง่าย ตอบสนองไวทั้ง 2 นิ้ว</h3>
      <ul>
        <li><strong>ฝั่งซ้าย (มือถือ)</strong>: เลื่อนนิ้วในวงกลมเพื่อเดินซ้าย-ขวา (คีย์บอร์ด: <code>A / D</code> หรือ <code>← / →</code>)</li>
        <li><strong>ปุ่มกระโดด</strong>: กด 2 ครั้งติดกันเพื่อทำ <span class="tut-pill-mint">Double Jump</span> (<code>Space / W / ↑</code>)</li>
        <li><strong>ปุ่มใช้พลัง</strong>: ยิงสุริยะ/จันทรา (<code>J / E / Shift</code>) | <strong>ปุ่มเรียก</strong>: ส่งสัญญาณเรียกเพื่อน (<code>H / C</code>)</li>
      </ul>`,
  },
  {
    title: '3/4 · ท่าประสานพลัง Co-op สำคัญ',
    html: `
      <h3>ช่วยกันผ่านจุดที่ไปคนเดียวไม่ได้</h3>
      <ul>
        <li><span class="tut-pill-mint">Partner Boost</span>: กระโดดเหยียบหัวคู่หูเพื่อพุ่งขึ้นที่สูง</li>
        <li><span class="tut-pill-mint">ผสานพลัง (Harmony)</span>: เมื่ออยู่ใกล้กัน กดปุ่ม <strong>ผสาน</strong> (<code>K / Q</code>) เพื่อฟื้นเลือดทั้งคู่หรือชุบชีวิตเพื่อนที่กลายเป็นร่างวิญญาณ</li>
        <li>เหยียบ <strong>เห็ดเรืองแสง</strong> เพื่อเด้งขึ้นสูง และผ่าน <strong>ตะเกียงนำทาง</strong> เพื่อเซฟจุดเกิดใหม่</li>
      </ul>`,
  },
  {
    title: '4/4 · ตะลุย 10 ด่าน & ปุ่มคำใบ้',
    html: `
      <h3>5 ดินแดนเรืองแสง & บอส 2 ระดับ</h3>
      <ul>
        <li>มีทั้งหมด <strong>10 ด่าน</strong>: ป่าหิ่งห้อย, ยอดไม้แสงเหนือ (มินิบอสด่าน 5), ถ้ำผลึก, ซากวิหาร, และศึกตัดสินบอสใหญ่ในด่าน 10</li>
        <li>ติดตรงไหนกดปุ่ม <span class="tut-pill-sola">💡 คำใบ้</span> มุมขวาบน (หรือกด <code>I</code>) เพื่อดูเป้าหมายและคำใบ้เฉพาะด่านนั้นได้ตลอด!</li>
        <li>เมื่อเจอบอส ให้ดู<strong>สีแกนกลาง</strong>เพื่อยิงธาตุที่แพ้ และจุดเสาซ้าย-ขวาพร้อมกันเมื่อบอสกางเกราะ</li>
      </ul>`,
  },
];

// =========================================================================
// Helpers & Hydrating World State
// =========================================================================

function hydrateWorldState(raw) {
  const actIdx = raw.actIndex || 0;
  const w = createWorldState(actIdx, {
    startedAt: raw.startedAt,
    totalShardsCollected: raw.totalShardsCollected,
    teamworkActions: raw.teamworkActions,
  });
  w.activeCheckpoint = raw.activeCheckpoint || null;
  w.burnedBriars = new Set(raw.burnedBriars || []);
  w.litTotems = new Set(raw.litTotems || []);
  w.openedGates = new Set(raw.openedGates || []);
  w.collectedShards = new Set(raw.collectedShards || []);
  w.playersHealth = { ...(raw.playersHealth || w.playersHealth) };
  w.playersSpirit = { ...(raw.playersSpirit || w.playersSpirit) };
  w.enemies = (raw.enemies || w.enemies).map((e) => ({ ...e }));
  w.boss = raw.boss ? { ...raw.boss } : null;
  w.projectiles = (raw.projectiles || []).map((p) => ({ ...p }));
  w.bossProjectiles = (raw.bossProjectiles || []).map((p) => ({ ...p }));
  w.victory = Boolean(raw.victory);
  return w;
}

function setupActEntities(worldObj, rawPositions = null) {
  state.world = worldObj;
  const level = ACTS[worldObj.actIndex];
  const solaSpawn = rawPositions?.sola || level.spawns.sola;
  const lunaSpawn = rawPositions?.luna || level.spawns.luna;

  state.players.sola = createPlayerEntity('sola', solaSpawn);
  state.players.luna = createPlayerEntity('luna', lunaSpawn);
  state.partnerTarget = null;
  state.emotes = [];
  state.shownHints.clear();
  state.portalRequestSent = false;
  state.bossMusicTriggered = false;
  state.hintIndex = 0;
  state.hintOpen = false;
  ui.hintCard.classList.add('hidden');
  ui.btnHint.classList.remove('has-pulse');

  state.tutChecklist = { move: false, briar: false, bridge: false, gate: false };
  renderChecklist();

  state.lastProgressTime = performance.now();
  state.lastProgressX = state.players[state.localRole].x;
  state.stuckHintShown = false;

  if (ui.selectPauseAct) ui.selectPauseAct.value = String(worldObj.actIndex);

  particles.clear();
  particles.seedAmbient(level);

  const localP = state.players[state.localRole];
  renderer.updateCamera(localP.x, localP.y, localP.facing, level, 0.1, true);
  audio.setBiome(level.biome);

  updateRoleButtonVisuals();
  updateHud();
}

function showActCurtain(actIndex) {
  const level = ACTS[actIndex];
  ui.curtainTitle.textContent = `ด่าน ${actIndex + 1}/10 · ${level.thaiName}`;
  ui.curtainSubtitle.textContent = level.objective || level.subtitle;
  ui.actCurtain.classList.remove('hidden');
  audio.playStageStart();
  setTimeout(() => {
    ui.actCurtain.classList.add('hidden');
  }, 2100);
}

function renderChecklist() {
  const level = ACTS[state.world.actIndex];
  const visible = Boolean(level?.isTutorial) && state.mode === 'playing';
  ui.tutorialChecklist.classList.toggle('hidden', !visible);
  if (!visible) return;

  const setItem = (el, done) => {
    if (!el) return;
    el.classList.toggle('done', done);
    const span = el.querySelector('span');
    if (span) span.textContent = done ? '✓' : '○';
  };
  setItem(ui.chkMove, state.tutChecklist.move);
  setItem(ui.chkBriar, state.tutChecklist.briar);
  setItem(ui.chkBridge, state.tutChecklist.bridge);
  setItem(ui.chkGate, state.tutChecklist.gate);
}

function markChecklistStep(key) {
  const level = ACTS[state.world.actIndex];
  if (!level?.isTutorial || state.tutChecklist[key]) return;
  state.tutChecklist[key] = true;
  renderChecklist();
  audio.playTutorialStepComplete();
}

function renderHintCard() {
  const level = ACTS[state.world.actIndex];
  const hints = level.stageHints || [];
  if (!hints.length) return;
  const idx = ((state.hintIndex % hints.length) + hints.length) % hints.length;
  state.hintIndex = idx;
  ui.hintStageTitle.textContent = `ด่าน ${state.world.actIndex + 1}: ${level.thaiName}`;
  ui.hintCounter.textContent = `${idx + 1} / ${hints.length}`;
  ui.hintObjective.textContent = `เป้าหมาย: ${level.objective || level.subtitle}`;
  ui.hintText.textContent = hints[idx];
}

function openHintCard(index = null) {
  if (typeof index === 'number') state.hintIndex = index;
  state.hintOpen = true;
  ui.btnHint.classList.remove('has-pulse');
  renderHintCard();
  ui.hintCard.classList.remove('hidden');
  audio.playHintChime();
}

function closeHintCard() {
  state.hintOpen = false;
  ui.hintCard.classList.add('hidden');
  audio.playUiClick();
}

function renderTutorialSlide(idx) {
  const total = TUTORIAL_SLIDES.length;
  state.tutorialSlide = Math.max(0, Math.min(total - 1, idx));
  const slide = TUTORIAL_SLIDES[state.tutorialSlide];
  ui.tutorialSlideBody.innerHTML = slide.html;

  ui.tutorialDots.innerHTML = TUTORIAL_SLIDES.map(
    (_, i) => `<span class="tut-dot ${i === state.tutorialSlide ? 'active' : ''}"></span>`
  ).join('');

  ui.btnTutPrev.disabled = state.tutorialSlide === 0;
  ui.btnTutPrev.style.opacity = state.tutorialSlide === 0 ? '0.45' : '1';
  ui.btnTutNext.textContent = state.tutorialSlide === total - 1 ? 'เริ่มเล่นเลย!' : 'ถัดไป';
}

function openTutorial(returnMode = 'title') {
  state.tutorialReturnMode = returnMode;
  renderTutorialSlide(0);
  ui.screenTutorial.classList.remove('hidden');
  audio.playMenuToggle(true);
}

function closeTutorial() {
  ui.screenTutorial.classList.add('hidden');
  try {
    localStorage.setItem('lumina_tutorial_seen', '1');
  } catch {
    // Ignore storage restriction
  }
  audio.playMenuToggle(false);
  if (state.tutorialReturnMode === 'paused') {
    showScreen('paused');
  }
}

function populateStageSelects() {
  const optionsHtml = ACTS.map(
    (act, i) => `<option value="${i}">ด่าน ${i + 1}: ${act.thaiName}</option>`
  ).join('');
  if (ui.selectSoloAct) ui.selectSoloAct.innerHTML = optionsHtml;
  if (ui.selectLobbyAct) ui.selectLobbyAct.innerHTML = optionsHtml;
  if (ui.selectPauseAct) ui.selectPauseAct.innerHTML = optionsHtml;
}

function showToast(text, duration = 4.2) {
  ui.hudToast.textContent = text;
  ui.hudToast.classList.remove('hidden');
  state.toastTimer = duration;
}

function showScreen(mode) {
  state.mode = mode;
  ui.screenTitle.classList.toggle('hidden', mode !== 'title');
  ui.screenLobby.classList.toggle('hidden', mode !== 'lobby');
  ui.gameHud.classList.toggle('hidden', mode !== 'playing' && mode !== 'paused');
  ui.screenPause.classList.toggle('hidden', mode !== 'paused');
  ui.screenVictory.classList.toggle('hidden', mode !== 'victory');
  renderChecklist();
}

function updateRoleButtonVisuals() {
  const isLuna = state.localRole === 'luna';
  ui.btnPower.classList.toggle('is-luna', isLuna);
  ui.btnPowerLabel.textContent = isLuna ? 'จันทรา' : 'สุริยะ';
  ui.btnSoloSwitch.classList.toggle('hidden', !state.isSolo);
}

function renderHearts(hp, isSpirit) {
  if (isSpirit) return '✧ วิญญาณ';
  const full = Math.max(0, Math.min(5, hp));
  return '♥'.repeat(full) + '♡'.repeat(5 - full);
}

function updateHud() {
  const level = ACTS[state.world.actIndex];
  const w = state.world;
  ui.hudHpSola.textContent = renderHearts(w.playersHealth.sola, w.playersSpirit.sola);
  ui.hudHpLuna.textContent = renderHearts(w.playersHealth.luna, w.playersSpirit.luna);
  ui.hudShards.textContent = `${w.collectedShards.size} / ${(level.shards || []).length}`;
  ui.hudActName.textContent = `ด่าน ${state.world.actIndex + 1}/${ACTS.length} · ${level.thaiName}`;

  if (state.isSolo) {
    ui.hudNetStatus.textContent = 'คู่หู AI';
  } else {
    ui.hudNetStatus.textContent = net.connected ? `${net.rttMs} ms` : 'กำลังเชื่อมต่อ...';
  }

  // Boss HUD
  if (w.boss && w.boss.alive) {
    ui.bossHud.classList.remove('hidden');
    ui.bossName.textContent = w.boss.thaiName;
    const pct = Math.max(0, Math.min(100, (w.boss.hp / w.boss.maxHp) * 100));
    ui.bossBarFill.style.width = `${pct}%`;

    ui.bossWeaknessBadge.classList.remove('is-lunar', 'is-shielded');
    if (w.boss.shielded) {
      ui.bossWeaknessBadge.textContent = 'จุดเสาตะวัน + จันทราพร้อมกัน!';
      ui.bossWeaknessBadge.classList.add('is-shielded');
    } else if (w.boss.stunTimer > 0) {
      ui.bossWeaknessBadge.textContent = 'เกราะแตก! โจมตีเต็มกำลัง!';
    } else if (w.boss.weakness === 'lunar') {
      ui.bossWeaknessBadge.textContent = 'แพ้พลังจันทรา';
      ui.bossWeaknessBadge.classList.add('is-lunar');
    } else {
      ui.bossWeaknessBadge.textContent = 'แพ้พลังตะวัน';
    }
  } else {
    ui.bossHud.classList.add('hidden');
  }
}

// =========================================================================
// World Event Handler (shared by Online WebSocket & Solo AI)
// =========================================================================

function handleWorldEvent(ev) {
  if (!ev) return;
  const w = state.world;

  switch (ev.type) {
    case 'briar_burned':
      w.burnedBriars.add(ev.briarId);
      if (typeof ev.teamworkActions === 'number') w.teamworkActions = ev.teamworkActions;
      audio.playBriarBurn();
      particles.emitExplosion(ev.x, ev.y, '#FFB347', 26, 220);
      particles.emitFloatingText(ev.x, ev.y - 20, 'เผาเถาวัลย์เงา!', '#FFB347');
      renderer.addShake(7);
      markChecklistStep('briar');
      break;

    case 'totem_lit':
      if (!ev.bossTotem) w.litTotems.add(ev.totemId);
      else if (w.boss && !w.boss.litShieldTotems.includes(ev.totemId)) {
        w.boss.litShieldTotems.push(ev.totemId);
      }
      if (typeof ev.teamworkActions === 'number') w.teamworkActions = ev.teamworkActions;
      audio.playTotemLit(ev.kind);
      particles.emitExplosion(ev.x, ev.y, ev.kind === 'solar' ? '#FFB347' : '#6EE7FF', 22, 180);
      break;

    case 'bridge_activated':
      audio.playTotemLit('lunar');
      particles.emitRing(ev.x, ev.y, 140, '#6EE7FF', 0.65, 3.5);
      showToast('สะพานแสงจันทราปรากฏขึ้นแล้ว!');
      markChecklistStep('bridge');
      break;

    case 'gate_opened':
      w.openedGates.add(ev.gateId);
      if (typeof ev.teamworkActions === 'number') w.teamworkActions = ev.teamworkActions;
      audio.playGateOpen();
      particles.emitExplosion(ev.x, ev.y, '#3CE6B5', 30, 220);
      renderer.addShake(9);
      showToast('ประตูโบราณเปิดออกแล้ว! เดินเข้าสู่ประตูมิติพร้อมกัน');
      markChecklistStep('gate');
      break;

    case 'blessing_granted':
      if (ev.playersHealth) w.playersHealth = { ...ev.playersHealth };
      if (ev.playersSpirit) w.playersSpirit = { ...ev.playersSpirit };
      audio.playHarmonyPulse();
      particles.emitHarmonyWave(ev.x, ev.y);
      showToast('เสาตะวันมอบพรฟื้นพลังให้ทั้งคู่!');
      break;

    case 'shard_collected':
      w.collectedShards.add(ev.shardId);
      if (typeof ev.totalShardsCollected === 'number') w.totalShardsCollected = ev.totalShardsCollected;
      state.shardCombo = state.shardComboTimer > 0 ? state.shardCombo + 1 : 0;
      state.shardComboTimer = 2.4;
      audio.playShardCollect(state.shardCombo);
      if (state.shardCombo >= 2) audio.playComboSparkle();
      particles.emitExplosion(ev.x, ev.y, '#8FF7E0', 14, 130);
      particles.emitFloatingText(ev.x, ev.y - 16, '+1 ผลึกวิญญาณ', '#8FF7E0');
      break;

    case 'projectile_impact':
      audio.playProjectileImpact(ev.power, ev.resisted);
      particles.emitExplosion(ev.x, ev.y, ev.resisted ? '#9333EA' : ev.power === 'solar' ? '#FFB347' : '#6EE7FF', 7, 90);
      if (ev.resisted) {
        particles.emitFloatingText(ev.x, ev.y - 18, 'ต้องใช้พลังตะวัน!', '#E879F9');
      }
      break;

    case 'boss_weakness':
      audio.playBossWeaknessShift(ev.weakness);
      particles.emitRing(ev.x, ev.y, 95, ev.weakness === 'solar' ? '#FFB347' : '#6EE7FF', 0.55, 3);
      break;

    case 'boss_shield_deflect':
      audio.playBossShieldDeflect();
      particles.emitRing(ev.x, ev.y, 45, '#C084FC', 0.35, 2.5);
      break;

    case 'checkpoint_lit':
      w.activeCheckpoint = ev.checkpointId;
      if (ev.playersHealth) w.playersHealth = { ...ev.playersHealth };
      if (ev.playersSpirit) w.playersSpirit = { ...ev.playersSpirit };
      audio.playCheckpoint();
      particles.emitExplosion(ev.x, ev.y - 36, '#FFB347', 18, 135);
      showToast('จุดตะเกียงนำทางแล้ว ฟื้นฟูพลังชีวิต');
      break;

    case 'partner_boosted':
      if (typeof ev.teamworkActions === 'number') w.teamworkActions = ev.teamworkActions;
      if (ev.role !== state.localRole) {
        audio.playPartnerBoost();
        particles.emitJumpRing(ev.x, ev.y, '#FFE699');
      }
      break;

    case 'enemy_hit':
      audio.playEnemyHit();
      particles.emitExplosion(ev.x, ev.y, ev.power === 'solar' ? '#FFB347' : '#6EE7FF', 10, 120);
      break;

    case 'enemy_defeated':
      audio.playEnemyDefeat();
      particles.emitExplosion(ev.x, ev.y, '#C084FC', 24, 200);
      renderer.addShake(5);
      break;

    case 'boss_hit':
      audio.playEnemyHit();
      particles.emitExplosion(ev.x, ev.y, ev.weakHit ? '#FFE680' : '#A855F7', 14, 160);
      particles.emitFloatingText(ev.x, ev.y - 24, `-${ev.dmg}`, ev.weakHit ? '#FFE680' : '#F0F6F7');
      break;

    case 'boss_phase':
      audio.playBossRoar();
      renderer.addShake(11);
      if (ev.phase === 2 && !state.bossMusicTriggered) {
        state.bossMusicTriggered = true;
        audio.setBiome('boss');
      }
      break;

    case 'boss_shield_up':
      audio.playBossRoar();
      showToast('บอสกางเกราะสุริยุปราคา! SOLA และ LUNA ต้องจุดเสาทั้งสองด้านพร้อมกัน!');
      break;

    case 'boss_shield_broken':
      if (w.boss) {
        w.boss.shielded = false;
        w.boss.stunTimer = 4.5;
        w.boss.hp = ev.hp;
      }
      if (typeof ev.teamworkActions === 'number') w.teamworkActions = ev.teamworkActions;
      audio.playBossShieldBreak();
      particles.emitExplosion(ev.x, ev.y, '#6EE7FF', 34, 280);
      particles.emitFloatingText(ev.x, ev.y - 40, 'เกราะสุริยุปราคาแตก!', '#FFE680');
      renderer.addShake(13);
      break;

    case 'boss_attack':
      audio.playBossAttack();
      break;

    case 'boss_defeated':
      if (w.boss) {
        w.boss.alive = false;
        w.boss.hp = 0;
      }
      audio.playBossDefeat();
      particles.emitExplosion(ev.x, ev.y, '#FFB347', 45, 320);
      particles.emitExplosion(ev.x, ev.y, '#6EE7FF', 35, 250);
      renderer.addShake(16);
      if (ev.isMiniBoss) {
        showToast('พิชิตวิญญาณวายุเงาสำเร็จ! ประตูมิติกลางลานเปิดออกแล้ว!');
      } else {
        showToast('พิชิตอัมบรา นอคทิส สำเร็จ!');
      }
      break;

    case 'player_damaged':
      if (ev.playersHealth) w.playersHealth = { ...ev.playersHealth };
      if (ev.playersSpirit) w.playersSpirit = { ...ev.playersSpirit };
      if (ev.role !== state.localRole) audio.playPlayerHurt();
      if (ev.role === state.localRole && ev.hp === 1) {
        audio.playLowHealthWarning();
      }
      break;

    case 'player_revived':
      if (ev.playersHealth) w.playersHealth = { ...ev.playersHealth };
      if (ev.playersSpirit) w.playersSpirit = { ...ev.playersSpirit };
      audio.playRevive();
      particles.emitHarmonyWave(ev.x, ev.y);
      particles.emitFloatingText(ev.x, ev.y - 26, 'ฟื้นพลังร่วมใจ!', '#3CE6B5');
      break;

    case 'harmony_failed':
      if (ev.reason === 'too_far') {
        showToast('ขยับเข้าใกล้คู่หูอีกนิดเพื่อใช้พลังผสานใจ', 2.4);
      }
      break;

    case 'portal_waiting':
      audio.playPortalWait();
      showToast('คู่หูรออยู่ที่ประตูมิติแล้ว!', 2.6);
      break;

    default:
      break;
  }
}

// =========================================================================
// Lobby & Pairing
// =========================================================================

async function updateLobbyUi(room) {
  if (!room) return;
  ui.lobbyCode.textContent = room.code;

  const solaSlot = room.players?.sola;
  const lunaSlot = room.players?.luna;
  ui.slotSolaPlayer.textContent = solaSlot
    ? `${solaSlot.name}${solaSlot.connected ? ' (พร้อม)' : ' (ขาดการเชื่อมต่อ)'}`
    : 'กำลังรอผู้เล่น...';
  ui.slotLunaPlayer.textContent = lunaSlot
    ? `${lunaSlot.name}${lunaSlot.connected ? ' (พร้อม)' : ' (ขาดการเชื่อมต่อ)'}`
    : 'กำลังรอเพื่อนสแกน QR...';

  ui.cardSola.classList.toggle('is-mine', state.localRole === 'sola');
  ui.cardLuna.classList.toggle('is-mine', state.localRole === 'luna');

  // Fetch LAN IP for scannable QR code on same Wi-Fi
  let baseUrl = window.location.origin;
  try {
    const res = await fetch('/api/network-info');
    if (res.ok) {
      const info = await res.json();
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = info.recommendedUrl || baseUrl;
      }
    }
  } catch {
    // Fallback to location.origin
  }

  state.inviteUrl = `${baseUrl}/?room=${room.code}`;
  ui.lobbyUrlText.textContent = state.inviteUrl;
  ui.lobbyQr.src = `/api/qr?url=${encodeURIComponent(state.inviteUrl)}`;

  if (ui.selectLobbyAct && typeof room.selectedActIndex === 'number') {
    ui.selectLobbyAct.value = String(room.selectedActIndex);
  }

  if (solaSlot && lunaSlot) {
    ui.lobbyHint.textContent = 'ครบ 2 คนแล้ว! กด "สลับตัวละคร" หรือกด "เริ่มการผจญภัย" ได้เลย';
  } else {
    ui.lobbyHint.textContent = 'ให้เพื่อนเปิดกล้องสแกน QR หรือกรอกรหัสห้องด้านบน (กดเริ่มก่อนแล้วให้เพื่อนตามมาทีหลังได้)';
  }
}

function showVictoryScreen(summary) {
  showScreen('victory');
  audio.setBiome('victory');
  audio.playVictoryFanfare();

  ui.vicShards.textContent = String(summary?.totalShardsCollected ?? state.world.totalShardsCollected);
  ui.vicTeamwork.textContent = String(summary?.teamworkActions ?? state.world.teamworkActions);
  const secs = Math.max(0, Math.round((summary?.elapsedMs ?? 0) / 1000));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  ui.vicTime.textContent = `${mins}:${String(rem).padStart(2, '0')}`;
}

// =========================================================================
// Network Event Listeners
// =========================================================================

net.on(MSG.ROOM_CREATED, ({ room }) => {
  state.isSolo = false;
  state.localRole = net.role || 'sola';
  showScreen('lobby');
  updateLobbyUi(room);
});

net.on(MSG.ROOM_JOINED, ({ room, worldState, role }) => {
  state.isSolo = false;
  state.localRole = role || net.role;
  if (room.phase === 'playing' && worldState) {
    setupActEntities(hydrateWorldState(worldState), worldState.playerPositions);
    showScreen('playing');
    showActCurtain(worldState.actIndex || 0);
  } else {
    showScreen('lobby');
    updateLobbyUi(room);
  }
});

net.on(MSG.ROOM_STATE, ({ room, yourRole }) => {
  if (yourRole) state.localRole = yourRole;
  if (state.mode === 'lobby') updateLobbyUi(room);
});

net.on(MSG.ROOM_ERROR, ({ error }) => {
  ui.titleError.textContent = error;
  ui.titleError.classList.remove('hidden');
});

net.on(MSG.GAME_STARTED, ({ worldState }) => {
  setupActEntities(hydrateWorldState(worldState), worldState.playerPositions);
  showScreen('playing');
  showActCurtain(worldState.actIndex || 0);
});

net.on(MSG.ACT_CHANGED, ({ worldState }) => {
  setupActEntities(hydrateWorldState(worldState), worldState.playerPositions);
  audio.playPortalEnter();
  showActCurtain(worldState.actIndex || 0);
});

net.on(MSG.PARTNER_STATE, (msg) => {
  state.partnerTarget = msg;
  const p = state.players[msg.role];
  if (p) {
    p.facing = msg.facing || p.facing;
    p.anim = msg.anim || p.anim;
    p.grounded = Boolean(msg.grounded);
  }
});

net.on(MSG.POWER_CAST, ({ role, projectile }) => {
  if (role !== state.localRole) {
    if (role === 'sola') audio.playSolarCast();
    else audio.playLunarCast();
  }
  if (!state.world.projectiles.some((p) => p.id === projectile.id)) {
    state.world.projectiles.push(projectile);
  }
});

net.on(MSG.HARMONY_TRIGGERED, (msg) => {
  state.world.playersHealth = { ...msg.playersHealth };
  state.world.playersSpirit = { ...msg.playersSpirit };
  state.world.teamworkActions = msg.teamworkActions;
  audio.playHarmonyPulse();
  particles.emitHarmonyWave(msg.x, msg.y);
  particles.emitFloatingText(msg.x, msg.y - 32, 'ประสานพลังฟื้นฟู!', '#FFF0B8');
  updateHud();
});

net.on(MSG.EMOTE_RECEIVED, (msg) => {
  audio.playEmotePing();
  state.emotes.push({ role: msg.role, x: msg.x, y: msg.y, life: 2.2 });
  particles.emitRing(msg.x, msg.y, 75, ROLES[msg.role]?.primary || '#FFF0B8', 0.55, 2.5);
});

net.on(MSG.WORLD_TICK, ({ tick }) => {
  if (!tick || state.isSolo) return;
  const w = state.world;
  if (tick.actIndex !== w.actIndex) return;

  w.totalShardsCollected = tick.totalShardsCollected;
  w.teamworkActions = tick.teamworkActions;
  w.playersHealth = { ...tick.playersHealth };
  w.playersSpirit = { ...tick.playersSpirit };
  w.enemies = tick.enemies;
  w.boss = tick.boss ? { ...(w.boss || {}), ...tick.boss } : null;
  w.projectiles = tick.projectiles;
  w.bossProjectiles = tick.bossProjectiles;

  if (w.boss && w.boss.alive && !state.bossMusicTriggered) {
    state.bossMusicTriggered = true;
    audio.setBiome('boss');
  }
});

net.on(MSG.WORLD_EVENT, ({ event }) => {
  handleWorldEvent(event);
});

net.on(MSG.VICTORY, ({ summary }) => {
  showVictoryScreen(summary);
});

net.on(MSG.PARTNER_CONNECTION, ({ role, connected, room }) => {
  if (state.mode === 'lobby') updateLobbyUi(room);
  else if (state.mode === 'playing') {
    const label = ROLES[role]?.name || role;
    showToast(connected ? `${label} กลับเข้าสู่เกมแล้ว` : `${label} สัญญาณหลุด กำลังรอเชื่อมต่อใหม่...`);
  }
});

// =========================================================================
// UI Controls Wiring
// =========================================================================

function unlockAudioOnce() {
  audio.unlock();
}
window.addEventListener('pointerdown', unlockAudioOnce, { once: true });
window.addEventListener('keydown', unlockAudioOnce, { once: true });

ui.btnCreateRoom.addEventListener('click', async () => {
  audio.unlock();
  audio.playUiClick();
  ui.titleError.classList.add('hidden');
  try {
    await net.connect();
    net.playerName = ui.inputPlayerName.value.trim();
    net.send(MSG.CREATE_ROOM, { name: net.playerName });
  } catch {
    ui.titleError.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่';
    ui.titleError.classList.remove('hidden');
  }
});

ui.btnToggleJoin.addEventListener('click', () => {
  audio.unlock();
  audio.playUiClick();
  ui.joinPanel.classList.toggle('hidden');
  if (!ui.joinPanel.classList.contains('hidden')) {
    ui.inputRoomCode.focus();
  }
});

async function attemptJoin(rawCode) {
  audio.unlock();
  audio.playUiClick();
  ui.titleError.classList.add('hidden');
  const code = String(rawCode || ui.inputRoomCode.value).trim().toUpperCase();
  if (code.length !== 4) {
    ui.titleError.textContent = 'กรุณากรอกรหัสห้อง 4 หลัก';
    ui.titleError.classList.remove('hidden');
    return;
  }
  try {
    await net.connect();
    net.playerName = ui.inputPlayerName.value.trim();
    net.send(MSG.JOIN_ROOM, { code, name: net.playerName });
  } catch {
    ui.titleError.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    ui.titleError.classList.remove('hidden');
  }
}

ui.btnJoinRoom.addEventListener('click', () => attemptJoin());
ui.inputRoomCode.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') attemptJoin();
});

ui.btnSoloMode.addEventListener('click', () => {
  audio.unlock();
  audio.playUiClick();
  net.disconnect();
  state.isSolo = true;
  state.localRole = 'sola';
  const startAct = Number(ui.selectSoloAct?.value || 0);
  setupActEntities(createWorldState(startAct, null, Date.now()));
  showScreen('playing');
  showActCurtain(startAct);
  showToast('โหมดคู่หู AI: กด "สลับ SOLA ⇄ LUNA" หรือ "💡 คำใบ้" ได้ตลอดเวลา!', 4.5);
});

ui.btnOpenTutorial.addEventListener('click', () => {
  audio.unlock();
  openTutorial('title');
});

ui.btnTutPrev.addEventListener('click', () => {
  audio.playUiClick();
  renderTutorialSlide(state.tutorialSlide - 1);
});

ui.btnTutNext.addEventListener('click', () => {
  audio.unlock();
  if (state.tutorialSlide >= TUTORIAL_SLIDES.length - 1) {
    closeTutorial();
  } else {
    audio.playUiClick();
    renderTutorialSlide(state.tutorialSlide + 1);
  }
});

ui.btnTutSkip.addEventListener('click', () => {
  audio.unlock();
  closeTutorial();
});

ui.selectLobbyAct.addEventListener('change', () => {
  audio.playUiClick();
  net.send(MSG.SELECT_ACT, { actIndex: Number(ui.selectLobbyAct.value) });
});

ui.btnHint.addEventListener('click', () => {
  audio.unlock();
  if (state.hintOpen) {
    closeHintCard();
  } else {
    openHintCard(state.hintIndex);
  }
});

ui.btnHintNext.addEventListener('click', () => {
  openHintCard(state.hintIndex + 1);
});

ui.btnHintClose.addEventListener('click', () => {
  closeHintCard();
});

ui.btnJumpAct.addEventListener('click', () => {
  audio.playUiClick();
  const targetAct = Number(ui.selectPauseAct.value || 0);
  if (state.isSolo) {
    const stats = {
      startedAt: state.world.startedAt,
      totalShardsCollected: state.world.totalShardsCollected,
      teamworkActions: state.world.teamworkActions,
    };
    setupActEntities(createWorldState(targetAct, stats, Date.now()));
    showScreen('playing');
    showActCurtain(targetAct);
  } else {
    net.send(MSG.SELECT_ACT, { actIndex: targetAct });
    showScreen('playing');
  }
});

ui.btnPauseTutorial.addEventListener('click', () => {
  openTutorial('paused');
});

ui.sliderBgm.addEventListener('input', () => {
  audio.unlock();
  audio.setBgmVolume(Number(ui.sliderBgm.value) / 100);
});

ui.sliderSfx.addEventListener('input', () => {
  audio.unlock();
  audio.setSfxVolume(Number(ui.sliderSfx.value) / 100);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyI' && state.mode === 'playing') {
    if (state.hintOpen) closeHintCard();
    else openHintCard(state.hintIndex);
  }
});

ui.btnCopyLink.addEventListener('click', async () => {
  audio.playUiClick();
  try {
    await navigator.clipboard.writeText(state.inviteUrl);
    ui.btnCopyLink.textContent = 'คัดลอกแล้ว!';
    setTimeout(() => {
      ui.btnCopyLink.textContent = 'คัดลอกลิงก์ชวนเพื่อน';
    }, 1800);
  } catch {
    showToast(state.inviteUrl);
  }
});

ui.btnSwapRole.addEventListener('click', () => {
  audio.playUiClick();
  net.send(MSG.SWAP_ROLES);
});

ui.btnStartGame.addEventListener('click', () => {
  audio.playUiClick();
  net.send(MSG.START_GAME, { actIndex: Number(ui.selectLobbyAct?.value || 0) });
});

ui.btnLeaveLobby.addEventListener('click', () => {
  audio.playUiClick();
  net.disconnect();
  showScreen('title');
});

ui.btnSoloSwitch.addEventListener('click', () => {
  if (!state.isSolo) return;
  audio.playSwapCharacter();
  state.localRole = state.localRole === 'sola' ? 'luna' : 'sola';
  updateRoleButtonVisuals();
  showToast(`ควบคุม ${ROLES[state.localRole].thaiName}`, 1.6);
});

ui.btnMute.addEventListener('click', () => {
  audio.unlock();
  const muted = audio.toggleMute();
  ui.btnMute.textContent = muted ? '🔇' : '🔊';
});

ui.btnMenu.addEventListener('click', () => {
  audio.playMenuToggle(true);
  ui.pauseRoomInfo.textContent = state.isSolo
    ? 'โหมดทดลองเล่นคนเดียว (คู่หู AI)'
    : `รหัสห้อง: ${net.roomCode || '-'} · เล่นเป็น ${ROLES[state.localRole].name}`;
  if (ui.selectPauseAct) ui.selectPauseAct.value = String(state.world.actIndex);
  showScreen('paused');
});

ui.btnResume.addEventListener('click', () => {
  audio.playMenuToggle(false);
  showScreen('playing');
});

ui.btnRestartAct.addEventListener('click', () => {
  audio.playUiClick();
  if (state.isSolo) {
    setupActEntities(createWorldState(0, null, Date.now()));
    showScreen('playing');
    showActCurtain(0);
  } else {
    net.send(MSG.RESTART_GAME);
    showScreen('playing');
  }
});

function returnHome() {
  audio.playUiClick();
  net.disconnect();
  state.isSolo = false;
  setupActEntities(createWorldState(0));
  audio.setBiome('title');
  showScreen('title');
}

ui.btnExitHome.addEventListener('click', returnHome);
ui.btnVictoryHome.addEventListener('click', returnHome);
ui.btnPlayAgain.addEventListener('click', () => {
  audio.playUiClick();
  if (state.isSolo) {
    setupActEntities(createWorldState(0, null, Date.now()));
    showScreen('playing');
    showActCurtain(0);
  } else {
    net.send(MSG.RESTART_GAME);
    showScreen('playing');
  }
});

ui.btnDismissPortrait.addEventListener('click', () => {
  state.portraitDismissed = true;
  ui.portraitBanner.classList.add('hidden');
});

function checkOrientation() {
  const isPortraitMobile = window.innerWidth < 680 && window.innerHeight > window.innerWidth;
  ui.portraitBanner.classList.toggle('hidden', state.portraitDismissed || !isPortraitMobile);
}

window.addEventListener('resize', () => {
  renderer.resize();
  checkOrientation();
});

// =========================================================================
// Action Dispatch (Power, Harmony, Emote)
// =========================================================================

function executeCast(role, player, nowSec) {
  if (!state.isSolo && role === state.localRole) {
    const cd = role === 'sola' ? POWERS.SOLAR_COOLDOWN : POWERS.LUNAR_COOLDOWN;
    if (nowSec >= state.localCooldownUntil && !state.world.playersSpirit[role]) {
      state.localCooldownUntil = nowSec + cd;
      if (role === 'sola') audio.playSolarCast();
      else audio.playLunarCast();
      net.send(MSG.CAST_POWER, { x: player.x, y: player.y, dir: player.facing });
    }
    return;
  }

  const proj = castPower(state.world, role, player.x, player.y, player.facing, nowSec);
  if (proj) {
    if (role === state.localRole) {
      const cd = role === 'sola' ? POWERS.SOLAR_COOLDOWN : POWERS.LUNAR_COOLDOWN;
      state.localCooldownUntil = nowSec + cd;
    }
    if (role === 'sola') audio.playSolarCast();
    else audio.playLunarCast();
  }
}

function executeHarmony(role, nowSec) {
  if (!state.isSolo) {
    net.send(MSG.HARMONY_PULSE);
    return;
  }
  const res = triggerHarmony(state.world, role, nowSec, false);
  if (res.ok) {
    audio.playHarmonyPulse();
    particles.emitHarmonyWave(res.x, res.y);
    particles.emitFloatingText(res.x, res.y - 30, 'ประสานพลังฟื้นฟู!', '#FFF0B8');
  } else if (res.reason === 'too_far') {
    showToast('ขยับเข้าใกล้คู่หูอีกนิดเพื่อใช้พลังผสานใจ', 2.2);
  }
}

function executeEmote(player) {
  if (!state.isSolo) {
    net.send(MSG.PING_EMOTE, { kind: 'here', x: player.x, y: player.y });
  } else {
    audio.playEmotePing();
    state.emotes.push({ role: player.role, x: player.x, y: player.y, life: 2.2 });
    particles.emitRing(player.x, player.y, 75, ROLES[player.role].primary, 0.55, 2.5);
  }
}

function applyPlayerEvents(player, events) {
  if (events.jumped) {
    audio.playJump();
    particles.emitJumpRing(player.x, player.y, ROLES[player.role].primary);
  }
  if (events.doubleJumped) {
    audio.playDoubleJump();
    particles.emitJumpRing(player.x, player.y, '#FFFFFF');
    if (player.role === state.localRole) markChecklistStep('move');
  }
  if (events.landed) {
    audio.playLand(events.landIntensity);
    particles.emitFootstepDust(player.x, player.y);
  }
  if (events.footstep) {
    audio.playFootstep(events.surfaceType);
    particles.emitFootstepDust(player.x, player.y);
  }
  if (events.bouncedMushroomId) {
    renderer.triggerMushroomBounce(events.bouncedMushroomId);
    audio.playBounceMushroom();
    particles.emitExplosion(player.x, player.y + 18, '#3CE6B5', 14, 150);
  }
  if (events.partnerBoosted) {
    audio.playPartnerBoost();
    particles.emitJumpRing(player.x, player.y, '#FFE699');
    if (!state.isSolo) net.send(MSG.PARTNER_BOOST, { x: player.x, y: player.y });
    else state.world.teamworkActions += 1;
  }
  if (events.damaged) {
    audio.playPlayerHurt();
    renderer.addShake(8);
    if (!state.isSolo) {
      net.send(MSG.PLAYER_DAMAGED, { amount: 1 });
    } else {
      const ev = recordDamage(state.world, player.role, 1);
      if (ev) handleWorldEvent(ev);
    }
  }
  for (const shardId of events.collectedShards) {
    if (!state.isSolo) {
      state.world.collectedShards.add(shardId);
      net.send(MSG.COLLECT_SHARD, { shardId });
    } else {
      const ev = collectShard(state.world, player.role, shardId);
      if (ev) handleWorldEvent(ev);
    }
  }
  for (const cpId of events.touchedCheckpoints) {
    if (!state.isSolo) {
      net.send(MSG.TOUCH_CHECKPOINT, { checkpointId: cpId });
    } else {
      const ev = touchCheckpoint(state.world, player.role, cpId);
      if (ev) handleWorldEvent(ev);
    }
  }
}

// =========================================================================
// Main 60fps Game Loop
// =========================================================================

let lastFrameMs = performance.now();

function frame(nowMs) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
  lastFrameMs = nowMs;
  const timeSec = state.isSolo ? performance.now() / 1000 : net.getServerNowSec();

  const level = ACTS[state.world.actIndex];
  const localRole = state.localRole;
  const partnerRole = localRole === 'sola' ? 'luna' : 'sola';
  const localPlayer = state.players[localRole];
  const partnerPlayer = state.players[partnerRole];

  if (state.mode === 'playing') {
    const snap = input.consumeFrame();

    if (snap.switchPressed && state.isSolo) {
      state.localRole = partnerRole;
      audio.playSwapCharacter();
      updateRoleButtonVisuals();
      showToast(`ควบคุม ${ROLES[state.localRole].thaiName}`, 1.6);
    }

    // Step local player
    const localEvents = stepPlayerPhysics(
      localPlayer,
      snap,
      level,
      state.world,
      partnerPlayer,
      dt,
      timeSec
    );
    applyPlayerEvents(localPlayer, localEvents);

    if (snap.powerPressed) executeCast(localRole, localPlayer, timeSec);
    if (snap.harmonyPressed) executeHarmony(localRole, timeSec);
    if (snap.emotePressed) executeEmote(localPlayer);

    // Step partner (AI companion in Solo mode OR interpolated remote player in Online mode)
    if (state.isSolo) {
      const aiSnap = computeAiCompanionInput(
        partnerPlayer,
        localPlayer,
        level,
        state.world,
        state.aiState,
        dt
      );
      const aiEvents = stepPlayerPhysics(
        partnerPlayer,
        aiSnap,
        level,
        state.world,
        localPlayer,
        dt,
        timeSec
      );
      applyPlayerEvents(partnerPlayer, aiEvents);
      if (aiSnap.powerPressed) executeCast(partnerRole, partnerPlayer, timeSec);
      if (aiSnap.harmonyPressed) executeHarmony(partnerRole, timeSec);

      state.world.playerPositions[localRole] = {
        x: localPlayer.x,
        y: localPlayer.y,
        vx: localPlayer.vx,
        vy: localPlayer.vy,
        facing: localPlayer.facing,
      };
      state.world.playerPositions[partnerRole] = {
        x: partnerPlayer.x,
        y: partnerPlayer.y,
        vx: partnerPlayer.vx,
        vy: partnerPlayer.vy,
        facing: partnerPlayer.facing,
      };

      const revives = checkPartnerReviveOverlap(state.world);
      for (const rev of revives) handleWorldEvent(rev);

      stepWorld(state.world, dt, (ev) => handleWorldEvent(ev));

      // Solo Act transition / Victory check
      if (state.world.victory) {
        showVictoryScreen({
          totalShardsCollected: state.world.totalShardsCollected,
          teamworkActions: state.world.teamworkActions,
          elapsedMs: Date.now() - state.world.startedAt,
        });
      } else if (level.portal && isPortalUnlocked(state.world)) {
        const distHuman = Math.hypot(localPlayer.x - level.portal.x, localPlayer.y - level.portal.y);
        if (distHuman < 82) {
          if (state.world.actIndex + 1 < ACTS.length) {
            const nextStats = {
              startedAt: state.world.startedAt,
              totalShardsCollected: state.world.totalShardsCollected,
              teamworkActions: state.world.teamworkActions,
            };
            setupActEntities(createWorldState(state.world.actIndex + 1, nextStats, Date.now()));
            audio.playPortalEnter();
            showActCurtain(state.world.actIndex);
          }
        }
      }
    } else {
      // Smoothly interpolate partner state from Wi-Fi WebSocket updates
      if (state.partnerTarget) {
        const alpha = Math.min(1, dt * 16);
        partnerPlayer.x += (state.partnerTarget.x - partnerPlayer.x) * alpha;
        partnerPlayer.y += (state.partnerTarget.y - partnerPlayer.y) * alpha;
        partnerPlayer.vx = state.partnerTarget.vx;
        partnerPlayer.vy = state.partnerTarget.vy;
      }

      // Send local player state at 20Hz
      if (nowMs - state.lastStateSendAt >= 48) {
        state.lastStateSendAt = nowMs;
        net.send(MSG.PLAYER_STATE, {
          x: Math.round(localPlayer.x * 10) / 10,
          y: Math.round(localPlayer.y * 10) / 10,
          vx: Math.round(localPlayer.vx),
          vy: Math.round(localPlayer.vy),
          facing: localPlayer.facing,
          grounded: localPlayer.grounded,
          anim: localPlayer.anim,
          t: Date.now(),
        });
      }

      // Check portal entry in online mode
      if (!state.portalRequestSent && level.portal && isPortalUnlocked(state.world)) {
        const dist = Math.hypot(localPlayer.x - level.portal.x, localPlayer.y - level.portal.y);
        if (dist < 82) {
          state.portalRequestSent = true;
          net.send(MSG.ENTER_PORTAL);
        }
      } else if (state.portalRequestSent && level.portal) {
        const dist = Math.hypot(localPlayer.x - level.portal.x, localPlayer.y - level.portal.y);
        if (dist > 130) state.portalRequestSent = false;
      }
    }

    // Projectile trails
    for (const proj of state.world.projectiles) {
      particles.emitCastTrail(proj.x, proj.y, proj.power);
    }

    // Contextual Act hints
    for (const h of level.hints || []) {
      const key = `${level.id}:${h.x}`;
      if (!state.shownHints.has(key) && Math.abs(localPlayer.x - h.x) < 120) {
        state.shownHints.add(key);
        audio.playHintChime();
        showToast(h.text, 5.2);
      }
    }

    // Idle / stuck gentle hint prompt
    if (Math.abs(localPlayer.x - state.lastProgressX) > 95) {
      state.lastProgressX = localPlayer.x;
      state.lastProgressTime = nowMs;
    } else if (!state.stuckHintShown && !state.hintOpen && nowMs - state.lastProgressTime > 15_000) {
      state.stuckHintShown = true;
      ui.btnHint.classList.add('has-pulse');
      audio.playHintChime();
      showToast('กดปุ่ม 💡 คำใบ้ มุมขวาบนเพื่อดูแนวทางผ่านด่านนี้!', 4.2);
    }

    // Spatial waterfall audio proximity
    let maxWfProx = 0;
    for (const wf of level.waterfalls || []) {
      const centerX = wf.x + wf.w * 0.5;
      const dist = Math.abs(localPlayer.x - centerX);
      const prox = Math.max(0, 1 - dist / 640);
      if (prox > maxWfProx) maxWfProx = prox;
    }
    audio.setWaterfallProximity(maxWfProx);

    // Cooldown button fill indicator
    const totalCd = localRole === 'sola' ? POWERS.SOLAR_COOLDOWN : POWERS.LUNAR_COOLDOWN;
    const remCd = Math.max(0, state.localCooldownUntil - timeSec);
    ui.powerCooldownRing.style.transform = `scaleY(${Math.min(1, remCd / totalCd).toFixed(2)})`;

    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) ui.hudToast.classList.add('hidden');
    }
    if (state.shardComboTimer > 0) state.shardComboTimer -= dt;

    for (let i = state.emotes.length - 1; i >= 0; i--) {
      state.emotes[i].life -= dt;
      if (state.emotes[i].life <= 0) state.emotes.splice(i, 1);
    }

    updateHud();
    renderer.updateCamera(localPlayer.x, localPlayer.y, localPlayer.facing, level, dt);
  } else {
    // Gentle Title/Lobby diorama camera drift
    renderer.updateCamera(1460 + Math.sin(timeSec * 0.12) * 320, 620, 1, level, dt);
    audio.setWaterfallProximity(0.28);
  }

  updateScarf(state.players.sola, timeSec);
  updateScarf(state.players.luna, timeSec);
  particles.update(dt, level);

  renderer.render({
    level,
    worldState: state.world,
    players: state.players,
    localRole,
    particles,
    timeSec,
    emotes: state.emotes,
  });
}

// =========================================================================
// Boot
// =========================================================================

input.attach({
  joyZone: ui.joyZone,
  joyKnob: ui.joyKnob,
  btnJump: ui.btnJump,
  btnPower: ui.btnPower,
  btnHarmony: ui.btnHarmony,
  btnEmote: ui.btnEmote,
});

populateStageSelects();
renderer.resize();
checkOrientation();
setupActEntities(createWorldState(0));
showScreen('title');

// Auto-fill & auto-join if launched from QR scan (`/?room=XXXX`)
const urlRoom = new URLSearchParams(window.location.search).get('room');
if (urlRoom && /^[A-Za-z0-9]{4}$/.test(urlRoom.trim())) {
  const cleanCode = urlRoom.trim().toUpperCase();
  ui.joinPanel.classList.remove('hidden');
  ui.inputRoomCode.value = cleanCode;
  attemptJoin(cleanCode);
} else {
  let seenTutorial = false;
  try {
    seenTutorial = localStorage.getItem('lumina_tutorial_seen') === '1';
  } catch {
    seenTutorial = false;
  }
  if (!seenTutorial) {
    openTutorial('title');
  }
}

requestAnimationFrame(frame);
