import './style.css';
import {
  WIZARD_PALETTES,
  BOW_BLESSINGS,
  randomItem,
  generateRandomNickname,
} from './data/nicknames.js';
import { pickOracleItem } from './data/fortunes.js';
import { MOKTAK_CHANTS } from './data/moktakChants.js';
import { generateTuViChart } from './utils/tuviEngine.js';
import { Soundscape } from './utils/soundscape.js';
import { RoomClient } from './utils/roomClient.js';
import { downloadOracleCardPng } from './utils/shareCardCanvas.js';
import { initModernOverlays, closeTopLayer } from './utils/overlays.js';
import { DobbySanctuaryWorld } from './world3d/DobbySanctuaryWorld.js';

function createInitialRandomProfile() {
  let prevNick = null;
  try {
    localStorage.removeItem('dobby_nick');
    prevNick = sessionStorage.getItem('dobby_last_nick');
  } catch {
    // ignore storage restrictions
  }
  const initialName = generateRandomNickname([prevNick]);
  try {
    sessionStorage.setItem('dobby_last_nick', initialName);
  } catch {
    // ignore storage restrictions
  }
  return {
    name: initialName,
    palette: randomItem(WIZARD_PALETTES),
  };
}

const initialProfile = createInitialRandomProfile();
const selfNickLabel = document.getElementById('self-nick-label');
if (selfNickLabel) {
  selfNickLabel.textContent = initialProfile.name;
}

await initModernOverlays();

const sound = new Soundscape();

const state = {
  merit: Number(localStorage.getItem('dobby_merit') || 18),
  moktakCount: Number(localStorage.getItem('dobby_moktak') || 1),
  autoMoktakTimer: null,
  oracleMode: 'food',
  currentOracleItem: null,
  currentTuViChart: null,
  isShakingOracle: false,
  shakeCaptionTimer: null,
  shakeRevealTimer: null,
  playerProfile: initialProfile,
};

// DOM Elements
const meritNumEl = document.getElementById('merit-num');
const onlineStatusEl = document.getElementById('online-status');
const breezeToastEl = document.getElementById('breeze-toast');

const moktakPopover = document.getElementById('moktak-popover');
const moktakCountVal = document.getElementById('moktak-count-val');
const moktakProgressFill = document.getElementById('moktak-progress-fill');
const moktakStrikeBtn = document.getElementById('moktak-strike-btn');
const moktakCocBadge = document.getElementById('moktak-coc-badge');
const moktakAutoBtn = document.getElementById('moktak-auto-btn');
const moktakAutoIcon = document.getElementById('moktak-auto-icon');
const moktakAutoLabel = document.getElementById('moktak-auto-label');
const moktakChantTitle = document.getElementById('moktak-chant-title');
const moktakChantMsg = document.getElementById('moktak-chant-msg');
const dockMoktakIcon = document.getElementById('dock-moktak-icon');

// Xin Quẻ Menu & Dialog Elements
const btnFortune = document.getElementById('btn-fortune');
const fortuneMenuPopover = document.getElementById('fortune-menu-popover');

const oracleShakeDialog = document.getElementById('oracle-shake-dialog');
const oracleModeKicker = document.getElementById('oracle-mode-kicker');
const oracleDialogTitle = document.getElementById('oracle-dialog-title');
const oracleStagePrompt = document.getElementById('oracle-stage-prompt');
const oracleCtaBox = document.getElementById('oracle-cta-box');
const oracleAnimStage = document.getElementById('oracle-anim-stage');
const oracleAnimCaption = document.getElementById('oracle-anim-caption');
const btnShakeOracle = document.getElementById('btn-shake-oracle');
const oracleResultCard = document.getElementById('oracle-result-card');
const oraclePortraitImg = document.getElementById('oracle-portrait-img');
const oracleCodeEl = document.getElementById('oracle-code');
const oraclePickTitleEl = document.getElementById('oracle-pick-title');
const oracleMetaTagsEl = document.getElementById('oracle-meta-tags');
const oracleRoastEl = document.getElementById('oracle-roast');
const oraclePoemEl = document.getElementById('oracle-poem');
const oracleTipEl = document.getElementById('oracle-tip');

const tuviDialog = document.getElementById('tuvi-dialog');
const tuviForm = document.getElementById('tuvi-form');
const tuviDobInput = document.getElementById('tuvi-dob');
const tuviResultSection = document.getElementById('tuvi-result-section');
const tuviLoveBadge = document.getElementById('tuvi-love-badge');
const tuviLoveFill = document.getElementById('tuvi-love-fill');
const tuviLoveText = document.getElementById('tuvi-love-text');
const tuviMoneyBadge = document.getElementById('tuvi-money-badge');
const tuviMoneyFill = document.getElementById('tuvi-money-fill');
const tuviMoneyText = document.getElementById('tuvi-money-text');
const tuviDarkDecree = document.getElementById('tuvi-dark-decree');

// Dynamic max date via Temporal.PlainDate
tuviDobInput.max = globalThis.Temporal.Now.plainDateISO().toString();

meritNumEl.textContent = String(state.merit);
selfNickLabel.textContent = state.playerProfile.name;
moktakCountVal.textContent = String(state.moktakCount);
moktakProgressFill.style.setProperty('--moktak-pct', (state.moktakCount / 108).toFixed(4));

let toastTimer = null;
function showBreezeToast(author, actionText) {
  breezeToastEl.textContent = `✨ ${author} ${actionText}`;
  breezeToastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    breezeToastEl.classList.remove('is-visible');
  }, 3800);
}

function setActiveDock(btnId) {
  document.querySelectorAll('.dock-btn').forEach((b) => {
    b.classList.toggle('is-active', b.id === btnId);
  });
}

function addMerit(delta = 1) {
  state.merit += delta;
  localStorage.setItem('dobby_merit', String(state.merit));
  meritNumEl.textContent = String(state.merit);
}

// Initialize 3D Sanctuary World
const world = new DobbySanctuaryWorld({
  canvas: document.getElementById('webgl-canvas'),
  labelsLayer: document.getElementById('labels-layer'),
  playerProfile: state.playerProfile,
  onStationActivate: (stationId) => {
    if (stationId === 'fortune') openXinQuePopover();
  },
  onDobbyBow: () => performBow(),
  onMoktakStrike: () => strikeMoktak({ ensurePanelOpen: false }),
  onAIMoktak: (aiName) => showBreezeToast(aiName, 'vừa gõ một tiếng mõ tịnh tâm vang khắp vườn!'),
  onBreezeToast: (author, text) => showBreezeToast(author, text),
});

await world.init();
if (world.dobbyPortraitDataUrl) {
  oraclePortraitImg.src = world.dobbyPortraitDataUrl;
}

// Connect Live Room Co-Presence (Supabase Realtime + /api/sanctuary + WS/BroadcastChannel)
let sanctuaryGlobalMerit = null;
const roomId = new URLSearchParams(window.location.search).get('room') || '1';
const roomClient = new RoomClient({
  roomId,
  onWelcome: (msg) => {
    if (Array.isArray(msg.peers)) {
      msg.peers.forEach((p) => world.crowd?.upsertRemotePeer(p));
      world.crowd?.ensureUniqueSelfSeat();
      const takenPeerNames = new Set(msg.peers.map((p) => p?.name).filter(Boolean));
      if (takenPeerNames.has(state.playerProfile.name)) {
        const uniqueName = generateRandomNickname([...takenPeerNames, state.playerProfile.name]);
        state.playerProfile = { ...state.playerProfile, name: uniqueName };
        selfNickLabel.textContent = uniqueName;
        world.crowd?.setSelfProfile(uniqueName, state.playerProfile.palette);
        try {
          sessionStorage.setItem('dobby_last_nick', uniqueName);
        } catch {
          // ignore storage restrictions
        }
      }
    }
    updateOnlineCount();
    const selfState = world.crowd?.serializeSelf();
    if (selfState) roomClient.sendState(selfState);
  },
  onPeerState: (peer) => {
    world.crowd?.upsertRemotePeer(peer);
    updateOnlineCount();
  },
  onPeerLeave: (id) => {
    world.crowd?.removeRemotePeer(id);
    updateOnlineCount();
  },
  onPeerGesture: (msg) => {
    if (msg.kind === 'bow') {
      const pos = world.crowd?.triggerBow(msg.id);
      if (pos && msg.blessing) world.addFloatingBlessing(pos, msg.blessing);
    } else if (msg.kind === 'moktak') {
      world.triggerMoktakStrike(msg.id, msg.blessing || '🪵 Cốc! Tịnh tâm!');
      sound.playMoktakKnock(false);
    }
  },
  onRemoteRitual: (ev) => {
    if (ev?.wizardName && ev?.summary) {
      showBreezeToast(ev.wizardName, ev.summary);
    }
  },
  onBackendStatus: (data) => {
    if (typeof data?.stats?.totalMerit === 'number') {
      sanctuaryGlobalMerit = data.stats.totalMerit;
      updateOnlineCount();
    }
  },
});

window.setInterval(() => {
  const selfState = world.crowd?.serializeSelf();
  if (selfState) roomClient.sendState(selfState);
}, 900);

function updateOnlineCount() {
  const count = world.crowd?.getOnlineCount() || 7;
  const meritSuffix =
    sanctuaryGlobalMerit !== null ? ` • Công đức Đền: ${sanctuaryGlobalMerit}` : ' • Không khung chat';
  onlineStatusEl.textContent = `${count} phù thuỷ đang ngồi chill${meritSuffix}`;
}
updateOnlineCount();

// Actions & Rituals
function performBow() {
  setActiveDock('btn-bow');
  const pos = world.crowd?.triggerBow();
  addMerit(1);

  const blessing = randomItem(BOW_BLESSINGS);
  if (pos) world.addFloatingBlessing(pos, blessing);
  sound.playChime([587.33, 880.0], 0.055);
  roomClient.sendGesture('bow', blessing);
  roomClient.recordRitual({
    ritualType: 'bow',
    wizardName: state.playerProfile.name,
    summary: `vừa cúi chào Giáo Chủ Dobby (${blessing})`,
    meritDelta: 1,
  });
}

function stopAutoMoktak() {
  if (state.autoMoktakTimer) {
    clearInterval(state.autoMoktakTimer);
    state.autoMoktakTimer = null;
  }
  moktakAutoBtn.setAttribute('aria-pressed', 'false');
  moktakAutoIcon.textContent = '▶️';
  moktakAutoLabel.textContent = 'Tự gõ đều';
}

function restartAnimClass(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.getBoundingClientRect();
  el.classList.add(className);
  for (const anim of el.getAnimations?.({ subtree: true }) || []) {
    anim.currentTime = 0;
    anim.play();
  }
}

function strikeMoktak({ ensurePanelOpen = false } = {}) {
  setActiveDock('btn-moktak');
  if (ensurePanelOpen && !moktakPopover.open) {
    if (fortuneMenuPopover.matches(':popover-open, .\\:popover-open')) {
      fortuneMenuPopover.hidePopover?.();
    }
    moktakPopover.showModal();
  }

  state.moktakCount = (state.moktakCount % 108) + 1;
  localStorage.setItem('dobby_moktak', String(state.moktakCount));
  moktakCountVal.textContent = String(state.moktakCount);
  moktakProgressFill.style.setProperty('--moktak-pct', (state.moktakCount / 108).toFixed(4));

  const isMilestone = state.moktakCount === 108;
  addMerit(isMilestone ? 10 : 1);

  const pick = randomItem(MOKTAK_CHANTS);
  moktakPopover.style.setProperty('--chant-accent', pick.accent);
  moktakChantTitle.textContent = `${pick.emoji} ${pick.title}`;
  moktakChantMsg.textContent = pick.message;
  moktakCocBadge.textContent = isMilestone ? 'VIÊN MÃN +10!' : 'CỐC! +1';

  restartAnimClass(moktakStrikeBtn, 'is-striking');
  restartAnimClass(dockMoktakIcon, 'is-striking');

  const popLabel = isMilestone
    ? '🪵 CỐC 108! Viên mãn Tịnh Tâm (+10 Phước Tự Do)!'
    : `${pick.shortPop} (+1 Phước)`;
  world.triggerMoktakStrike('self', popLabel);

  sound.playMoktakKnock(isMilestone);
  roomClient.sendGesture('moktak', pick.shortPop);

  if (isMilestone) {
    sound.playChime([523.25, 659.25, 783.99, 1046.5], 0.07);
    showBreezeToast(state.playerProfile.name, 'vừa gõ trọn 108 tiếng Mõ Hắc Hoả (+10 Phước Tự Do)!');
    roomClient.recordRitual({
      ritualType: 'moktak_108',
      wizardName: state.playerProfile.name,
      summary: 'vừa gõ trọn 108 tiếng Mõ Hắc Hoả (+10 Phước Tự Do)!',
      meritDelta: 10,
    });
  } else if (state.moktakCount % 6 === 0) {
    roomClient.recordRitual({
      ritualType: 'moktak',
      wizardName: state.playerProfile.name,
      summary: `vừa tịnh tâm gõ mõ (${pick.shortPop})`,
      meritDelta: 1,
    });
  }
}

moktakStrikeBtn.addEventListener('animationend', (event) => {
  const anim = 'animation' in AnimationEvent.prototype
    ? event.animation
    : event.target.getAnimations?.().find((a) => a.animationName === event.animationName);
  const name = anim?.animationName || event.animationName;
  if (name === 'moktak-coc-float') {
    moktakStrikeBtn.classList.remove('is-striking');
  }
});

dockMoktakIcon.addEventListener('animationend', () => {
  dockMoktakIcon.classList.remove('is-striking');
});

// ============================================================================
// XIN QUẺ MENU POPOVER & 3 MODES ("Hôm nay ăn gì", "Hôm nay đi đâu", "Lá số tử vi")
// ============================================================================

function openXinQuePopover() {
  setActiveDock('btn-fortune');
  if (fortuneMenuPopover.matches(':popover-open, .\\:popover-open')) return;
  try {
    fortuneMenuPopover.showPopover?.({ source: btnFortune });
  } catch {
    fortuneMenuPopover.showPopover?.();
  }
}

fortuneMenuPopover.addEventListener('toggle', (event) => {
  if (event.newState === 'open') {
    setActiveDock('btn-fortune');
    sound.playChime([587.33, 880.0], 0.04);
  }
});

for (const itemBtn of fortuneMenuPopover.querySelectorAll('[data-xin-que]')) {
  itemBtn.addEventListener('click', () => {
    const choice = itemBtn.dataset.xinQue;
    fortuneMenuPopover.hidePopover?.();
    if (choice === 'food' || choice === 'place') {
      openOracleShakeDialog(choice);
    } else if (choice === 'tuvi') {
      openTuViDialog();
    }
  });
}

function getCheckedRadioValue(name, fallback) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : fallback;
}

function renderOraclePick(item) {
  state.currentOracleItem = item;
  oracleCodeEl.textContent = `✨ ${item.code} ✨`;
  oraclePickTitleEl.textContent = item.title;
  oracleMetaTagsEl.textContent = `${item.priceNote}  •  ${item.vibeNote}`;
  oracleRoastEl.textContent = item.roast;
  oraclePoemEl.innerHTML = item.poem
    .split('\n')
    .map((ln) => `“${ln}”`)
    .join('<br />');
  oracleTipEl.textContent = item.tip;
  oracleResultCard.hidden = false;
}

function resetOracleToFilterStage() {
  clearTimeout(state.shakeCaptionTimer);
  clearTimeout(state.shakeRevealTimer);
  state.isShakingOracle = false;
  oracleAnimStage.classList.remove('is-playing');
  oracleAnimStage.hidden = true;
  oracleResultCard.hidden = true;
  oracleCtaBox.hidden = false;
}

function openOracleShakeDialog(mode) {
  state.oracleMode = mode;
  state.currentOracleItem = null;
  resetOracleToFilterStage();

  if (mode === 'place') {
    oracleModeKicker.textContent = '🧭 QUẺ XUẤT HÀNH HẮC HOẢ';
    oracleDialogTitle.textContent = 'Hôm nay đi đâu';
    oracleStagePrompt.textContent =
      'Chọn ngân sách & đi 1 mình hay tụ tập, rồi bấm lắc ống xăm để Dobby chốt toạ độ giải ngố!';
  } else {
    oracleModeKicker.textContent = '🍜 QUẺ ẨM THỰC HẮC HOẢ';
    oracleDialogTitle.textContent = 'Hôm nay ăn gì';
    oracleStagePrompt.textContent =
      'Chọn ngân sách & đi 1 mình hay tụ tập, rồi bấm lắc ống xăm để Dobby cứu chiếc bụng đói!';
  }

  setActiveDock('btn-fortune');
  sound.playChime([523.25, 783.99], 0.045);
  if (!oracleShakeDialog.open) {
    oracleShakeDialog.showModal();
  }
}

function shakeOracleStick() {
  if (state.isShakingOracle) return;
  state.isShakingOracle = true;

  const budget = getCheckedRadioValue('oracle-budget', 'mid');
  const company = getCheckedRadioValue('oracle-company', 'solo');
  const picked = pickOracleItem(
    state.oracleMode,
    budget,
    company,
    state.currentOracleItem?.id || null,
  );

  // Stage 2: Hide CTA & previous result -> Show Shaking + Falling-Stick Animation Stage
  oracleCtaBox.hidden = true;
  oracleResultCard.hidden = true;
  oracleAnimCaption.textContent = '🎋 Đang lắc ống xăm triệu hồi Giáo Chủ Dobby...';
  oracleAnimStage.hidden = false;
  restartAnimClass(oracleAnimStage, 'is-playing');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  sound.playOracleShake(!reducedMotion);
  addMerit(1);

  clearTimeout(state.shakeCaptionTimer);
  clearTimeout(state.shakeRevealTimer);

  if (!reducedMotion) {
    state.shakeCaptionTimer = window.setTimeout(() => {
      oracleAnimCaption.textContent = '✨ Rớt quẻ rồi! Thẻ xăm vừa văng xuống chiếu đỏ...';
    }, 1020);
  }

  // Stage 3: Only AFTER "lắc quẻ + rớt quẻ" finishes -> Hide anim stage & reveal result card
  const totalMs = reducedMotion ? 440 : 1920;
  state.shakeRevealTimer = window.setTimeout(() => {
    state.isShakingOracle = false;
    oracleAnimStage.classList.remove('is-playing');
    oracleAnimStage.hidden = true;
    renderOraclePick(picked);
    oracleResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    roomClient.recordRitual({
      ritualType: state.oracleMode,
      wizardName: state.playerProfile.name,
      summary: `vừa xin quẻ ${state.oracleMode === 'place' ? 'Hôm nay đi đâu' : 'Hôm nay ăn gì'}: ${picked.title}`,
      meritDelta: 1,
      meta: { itemId: picked.id, budget, company },
    });
  }, totalMs);
}

for (const radio of document.querySelectorAll('input[name="oracle-budget"], input[name="oracle-company"]')) {
  radio.addEventListener('change', () => {
    if (!state.isShakingOracle && !oracleResultCard.hidden) {
      resetOracleToFilterStage();
    }
  });
}

oracleShakeDialog.addEventListener('close', () => {
  clearTimeout(state.shakeCaptionTimer);
  clearTimeout(state.shakeRevealTimer);
  state.isShakingOracle = false;
});

btnShakeOracle.addEventListener('click', () => shakeOracleStick());
document.getElementById('btn-reroll-oracle').addEventListener('click', () => shakeOracleStick());

document.getElementById('btn-download-oracle').addEventListener('click', () => {
  if (!state.currentOracleItem) return;
  downloadOracleCardPng({
    mode: state.oracleMode,
    item: state.currentOracleItem,
    portraitDataUrl: world.dobbyPortraitDataUrl,
    playerName: state.playerProfile.name,
  });
});

// ============================================================================
// MODE 3: LÁ SỐ TỬ VI (CHỈ SỐ TÌNH DUYÊN, CHỈ SỐ TÀI CHÍNH & TỐI HẬU THƯ DOBBY)
// ============================================================================

function openTuViDialog() {
  setActiveDock('btn-fortune');
  sound.playChime([523.25, 659.25, 987.77], 0.05);
  if (!tuviDialog.open) {
    tuviDialog.showModal();
  }
}

function renderTuViSummary(chart) {
  state.currentTuViChart = chart;

  tuviLoveBadge.textContent = chart.commentary.loveBadge;
  tuviLoveFill.style.setProperty('--score-pct', (chart.commentary.loveScore / 100).toFixed(2));
  tuviLoveText.textContent = chart.commentary.loveText;

  tuviMoneyBadge.textContent = chart.commentary.moneyBadge;
  tuviMoneyFill.style.setProperty('--score-pct', (chart.commentary.moneyScore / 100).toFixed(2));
  tuviMoneyText.textContent = chart.commentary.moneyText;

  tuviDarkDecree.textContent = chart.commentary.darkDecree;

  tuviResultSection.hidden = false;
  tuviResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

tuviForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!tuviForm.checkValidity()) {
    tuviDobInput.classList.add('user-invalid-fallback');
    tuviDobInput.setAttribute('aria-invalid', 'true');
    tuviDobInput.focus();
    return;
  }

  tuviDobInput.classList.remove('user-invalid-fallback');
  tuviDobInput.setAttribute('aria-invalid', 'false');

  // Parse calendar-only date directly with Temporal.PlainDate (no UTC Date drift)
  const dobPlainDate = globalThis.Temporal.PlainDate.from(tuviDobInput.value);
  const todayPlainDate = globalThis.Temporal.Now.plainDateISO();
  const gender = getCheckedRadioValue('tuvi-gender', 'nam');

  const chart = generateTuViChart({
    dobPlainDate,
    gender,
    todayPlainDate,
  });

  sound.playOracleShake(false);
  addMerit(2);
  renderTuViSummary(chart);
  roomClient.recordRitual({
    ritualType: 'tuvi',
    wizardName: state.playerProfile.name,
    summary: `vừa xem Lá số tử vi (${chart.commentary.loveBadge} • ${chart.commentary.moneyBadge})`,
    meritDelta: 2,
    meta: { gender },
  });
});

// ============================================================================
// WIRE REMAINING DOCK & HUD CONTROLS
// ============================================================================

document.getElementById('btn-sit').addEventListener('click', () => {
  setActiveDock('btn-sit');
  world.crowd?.sitSelfNearestCushion();
});

document.getElementById('btn-bow').addEventListener('click', () => performBow());

document.getElementById('btn-moktak').addEventListener('click', () => {
  strikeMoktak({ ensurePanelOpen: true });
});

document.getElementById('moktak-close-btn').addEventListener('click', () => {
  closeTopLayer(moktakPopover);
});

moktakPopover.addEventListener('close', () => {
  stopAutoMoktak();
  setActiveDock('btn-sit');
});

moktakStrikeBtn.addEventListener('click', () => strikeMoktak({ ensurePanelOpen: false }));

moktakAutoBtn.addEventListener('click', () => {
  if (state.autoMoktakTimer) {
    stopAutoMoktak();
  } else {
    moktakAutoBtn.setAttribute('aria-pressed', 'true');
    moktakAutoIcon.textContent = '⏸️';
    moktakAutoLabel.textContent = 'Tạm dừng';
    strikeMoktak({ ensurePanelOpen: false });
    state.autoMoktakTimer = window.setInterval(() => {
      strikeMoktak({ ensurePanelOpen: false });
    }, 1050);
  }
});

moktakPopover.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    strikeMoktak({ ensurePanelOpen: false });
  },
  { passive: false },
);

for (const closeBtn of document.querySelectorAll('[data-close-dialog]')) {
  closeBtn.addEventListener('click', () => {
    const dlg = document.getElementById(closeBtn.dataset.closeDialog);
    closeTopLayer(dlg);
    setActiveDock('btn-sit');
  });
}

document.getElementById('btn-reroll-nick').addEventListener('click', () => {
  const activeActorNames = world.crowd
    ? Array.from(world.crowd.actors.values()).map((a) => a.name)
    : [state.playerProfile.name];
  const nextName = generateRandomNickname([state.playerProfile.name, ...activeActorNames]);
  const otherPalettes = WIZARD_PALETTES.filter((p) => p !== state.playerProfile.palette);
  const nextPal = randomItem(otherPalettes.length > 0 ? otherPalettes : WIZARD_PALETTES);
  state.playerProfile = { name: nextName, palette: nextPal };
  try {
    sessionStorage.setItem('dobby_last_nick', nextName);
  } catch {
    // ignore storage restrictions
  }
  selfNickLabel.textContent = nextName;
  world.crowd?.setSelfProfile(nextName, nextPal);
  const selfState = world.crowd?.serializeSelf();
  if (selfState) roomClient.sendState(selfState);
  sound.playChime([659.25, 783.99], 0.045);
});

document.getElementById('btn-sound').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  const on = sound.toggleAmbience();
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  document.getElementById('sound-icon').textContent = on ? '🔊' : '🔇';
});

window.__SANCTUARY_WORLD = world;
window.__SANCTUARY_READY = true;
