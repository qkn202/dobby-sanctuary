import * as THREE from 'three';
import { WIZARD_PALETTES, BOW_TOASTS, randomItem } from '../data/nicknames.js';

export const CUSHION_SPOTS = [
  { x: -1.68, z: -0.05, col: '#FDBA74' },
  { x: -1.32, z: -0.95, col: '#FDE047' },
  { x: -1.12, z: -1.92, col: '#FBCFE8' },
  { x:  1.12, z: -1.92, col: '#86EFAC' },
  { x:  1.32, z: -0.95, col: '#FDE047' },
  { x:  1.68, z: -0.05, col: '#FDBA74' },
  { x: -1.78, z:  0.88, col: '#86EFAC' },
  { x: -0.78, z:  1.06, col: '#FDE047' },
  { x:  0.78, z:  1.06, col: '#FDBA74' },
  { x:  1.78, z:  0.88, col: '#DDD6FE' },
];

const AI_PRESETS = [
  { id: 'ai-1', seatIdx: 0, name: '🦉 Cú Mèo Đưa Thư', hat: '#631325', cloak: '#7F1D32', scarf: '#F59E0B', hair: '#5A3826', glow: '#FDE047' },
  { id: 'ai-2', seatIdx: 1, name: '🧪 Độc Dược Trà Đào', hat: '#172554', cloak: '#1E3A8A', scarf: '#38BDF8', hair: '#9A6B3B', glow: '#93C5FD' },
  { id: 'ai-3', seatIdx: 2, name: '🔮 Tiên Tri Ngủ Gật', hat: '#3B0764', cloak: '#581C87', scarf: '#F472B6', hair: '#3E2723', glow: '#F9A8D4' },
  { id: 'ai-4', seatIdx: 3, name: '🍺 Bia Bơ Ba Chổi', hat: '#3B2516', cloak: '#4E321F', scarf: '#FACC15', hair: '#4A2E1B', glow: '#FEF08A' },
  { id: 'ai-5', seatIdx: 4, name: '🧦 Hội Trưởng Tất Rách', hat: '#064E3B', cloak: '#065F46', scarf: '#FBBF24', hair: '#6D4C41', glow: '#6EE7B7' },
  { id: 'ai-6', seatIdx: 5, name: '🪄 Đũa Phép Gãy Ngọn', hat: '#26173E', cloak: '#342056', scarf: '#10B981', hair: '#2C1E18', glow: '#6EE7B7' },
];

const SHRINE_POS = new THREE.Vector3(0, 0, -1.15);
const MOKTAK_SHRINE_POS = new THREE.Vector3(0, 0, -0.08);

export class CrowdManager {
  constructor({ scene, wizardTemplate, chibiTemplate, playerProfile, onBreezeToast, onAIMoktak }) {
    this.scene = scene;
    this.wizardTemplate = wizardTemplate || chibiTemplate;
    this.onBreezeToast = onBreezeToast;
    this.onAIMoktak = onAIMoktak;
    this.actors = new Map();
    this.aiNextGestureAt = performance.now() + 5500;

    // Spawn local wizard player on foreground cushion #7 facing Dobby
    const startSeat = CUSHION_SPOTS[7];
    this.selfId = 'self';
    this.spawnActor({
      id: this.selfId,
      isSelf: true,
      name: playerProfile.name,
      palette: playerProfile.palette,
      x: startSeat.x,
      z: startSeat.z,
      seatedIdx: 7,
    });

    // Spawn cozy AI wizard companions so the sanctuary feels warm and alive immediately
    for (const ai of AI_PRESETS) {
      const sp = CUSHION_SPOTS[ai.seatIdx];
      this.spawnActor({
        id: ai.id,
        isSelf: false,
        isAI: true,
        name: ai.name,
        palette: { hat: ai.hat, cloak: ai.cloak, scarf: ai.scarf, hair: ai.hair, glow: ai.glow },
        x: sp.x,
        z: sp.z,
        seatedIdx: ai.seatIdx,
      });
    }
  }

  createMoktakProp() {
    const root = new THREE.Group();

    const fishGroup = new THREE.Group();
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.105, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.65 }),
    );
    pad.position.y = -0.045;

    const fishBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.088, 18, 14),
      new THREE.MeshStandardMaterial({ color: '#6b3416', roughness: 0.36, metalness: 0.08 }),
    );
    fishBody.scale.set(1.2, 0.85, 1.05);

    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.018, 0.05),
      new THREE.MeshStandardMaterial({ color: '#1a0c05', roughness: 0.9 }),
    );
    slit.position.set(0, -0.008, 0.072);

    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 10),
      new THREE.MeshStandardMaterial({
        color: '#34d399',
        emissive: '#10b981',
        emissiveIntensity: 1.4,
        roughness: 0.2,
      }),
    );
    gem.scale.set(1.3, 0.5, 1.0);
    gem.position.set(0, 0.068, 0.01);

    fishGroup.add(pad, fishBody, slit, gem);
    root.add(fishGroup);

    // Mallet pivot positioned to the Chibi's right hand so rotation.z swings the head onto the wooden fish
    const malletPivot = new THREE.Group();
    malletPivot.position.set(0.18, 0.06, 0.02);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.012, 0.19, 10),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.45 }),
    );
    stick.rotation.z = Math.PI * 0.36;
    stick.position.set(-0.075, 0.042, 0);

    const striker = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 14, 12),
      new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#f59e0b', emissiveIntensity: 0.35, roughness: 0.32 }),
    );
    striker.scale.set(1.15, 0.95, 0.95);
    striker.position.set(-0.155, 0.082, 0);

    malletPivot.add(stick, striker);
    root.add(malletPivot);

    root.position.set(0, 0.35, 0.29);
    root.visible = false;
    return { root, fishBody, malletPivot, gem };
  }

  applyPalette(meshRoot, palette) {
    const hatCol = palette.hat || palette.beanie || '#26173E';
    const cloakCol = palette.cloak || palette.coat || '#342056';
    const scarfCol = palette.scarf || palette.beanie || '#10B981';
    const hairCol = palette.hair || '#4A2E1B';
    const glowCol = palette.glow || '#6EE7B7';

    let wandTipMat = null;
    meshRoot.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone();
        const mName = o.material.name || '';
        if (mName.includes('WizardHat')) o.material.color.set(hatCol);
        else if (mName.includes('WizardCloak')) o.material.color.set(cloakCol);
        else if (mName.includes('WizardScarf')) o.material.color.set(scarfCol);
        else if (mName.includes('WizardHair')) o.material.color.set(hairCol);
        else if (mName.includes('WizardGlow')) {
          o.material.color.set(glowCol);
          if (o.material.emissive) {
            o.material.emissive.set(glowCol);
            o.material.emissiveIntensity = 1.45;
          }
          if (o.name.includes('Wand_TipGlow')) wandTipMat = o.material;
        }
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return wandTipMat;
  }

  spawnActor({ id, isSelf = false, isAI = false, name, palette, x = 0, z = 1.1, seatedIdx = -1 }) {
    const pal = palette || randomItem(WIZARD_PALETTES);
    const obj = this.wizardTemplate.clone(true);
    obj.rotation.order = 'YXZ';
    const wandTipMat = this.applyPalette(obj, pal);

    const moktak = this.createMoktakProp();
    obj.add(moktak.root);

    const baseY = seatedIdx >= 0 ? 0.25 : 0.02;
    obj.position.set(x, baseY, z);
    const yawToDobby = Math.atan2(SHRINE_POS.x - x, SHRINE_POS.z - z);
    obj.rotation.y = yawToDobby;

    this.scene.add(obj);
    const actor = {
      id,
      isSelf,
      isAI,
      name,
      palette: pal,
      obj,
      wandTipMat,
      moktak,
      seatedIdx,
      targetPos: null,
      targetSeatIdx: -1,
      bowUntil: 0,
      moktakUntil: 0,
      moktakStrikeAt: -9999,
      walkPhase: Math.random() * Math.PI * 2,
    };
    this.actors.set(id, actor);
    return actor;
  }

  getSelf() {
    return this.actors.get(this.selfId);
  }

  setSelfProfile(name, palette) {
    const self = this.getSelf();
    if (!self) return;
    self.name = name;
    if (palette) {
      self.palette = palette;
      self.wandTipMat = this.applyPalette(self.obj, palette);
    }
  }

  avoidObstacles(x, z, seatIdx) {
    let tx = THREE.MathUtils.clamp(x, -3.75, 3.75);
    let tz = THREE.MathUtils.clamp(z, -3.45, 3.65);
    if (seatIdx >= 0) return { tx, tz };

    // Keep inside the octagonal honey-oak pavilion perimeter walls & columns
    const rDeck = Math.hypot(tx, tz + 0.45);
    if (rDeck > 3.88) {
      const s = 3.88 / rDeck;
      tx *= s;
      tz = -0.45 + (tz + 0.45) * s;
    }

    // Smooth circular repulsion around Dobby's Obsidian Altar, Shrine Moktak & Fortune Station
    const blockers = [
      { x: SHRINE_POS.x, z: SHRINE_POS.z, r: 0.86 },
      { x: MOKTAK_SHRINE_POS.x, z: MOKTAK_SHRINE_POS.z, r: 0.46 },
      { x: 3.05, z: 0.45, r: 0.62 },
    ];
    for (const b of blockers) {
      const dx = tx - b.x;
      const dz = tz - b.z;
      const dist = Math.hypot(dx, dz);
      if (dist < b.r) {
        const ang = dist > 1e-4 ? Math.atan2(dz, dx) : 0;
        tx = b.x + Math.cos(ang) * b.r;
        tz = b.z + Math.sin(ang) * b.r;
      }
    }
    return { tx, tz };
  }

  walkSelfTo(x, z, seatIdx = -1) {
    const self = this.getSelf();
    if (!self) return;
    const { tx, tz } = this.avoidObstacles(x, z, seatIdx);
    self.seatedIdx = -1;
    self.targetPos = new THREE.Vector3(tx, 0.02, tz);
    self.targetSeatIdx = seatIdx;
  }

  sitSelfNearestCushion() {
    const self = this.getSelf();
    if (!self) return 7;
    const occupied = new Set(
      Array.from(this.actors.values())
        .filter((a) => !a.isSelf && a.seatedIdx >= 0)
        .map((a) => a.seatedIdx),
    );
    let bestIdx = 7;
    let bestD = Infinity;
    CUSHION_SPOTS.forEach((sp, idx) => {
      if (occupied.has(idx)) return;
      const d = Math.hypot(sp.x - self.obj.position.x, sp.z - self.obj.position.z);
      if (d < bestD) {
        bestD = d;
        bestIdx = idx;
      }
    });
    const sp = CUSHION_SPOTS[bestIdx];
    if (bestD < 0.25) {
      self.seatedIdx = bestIdx;
      self.targetPos = null;
      self.obj.position.set(sp.x, 0.25, sp.z);
      self.obj.rotation.y = Math.atan2(SHRINE_POS.x - sp.x, SHRINE_POS.z - sp.z);
    } else {
      this.walkSelfTo(sp.x, sp.z, bestIdx);
    }
    return bestIdx;
  }

  ensureUniqueSelfSeat() {
    const self = this.getSelf();
    if (!self || self.seatedIdx < 0) return false;
    const occupied = new Set(
      Array.from(this.actors.values())
        .filter((a) => !a.isSelf && a.seatedIdx >= 0)
        .map((a) => a.seatedIdx),
    );
    if (!occupied.has(self.seatedIdx)) return false;
    const freeIdx = [8, 6, 9, 7].find((idx) => !occupied.has(idx));
    if (freeIdx === undefined) return false;
    const sp = CUSHION_SPOTS[freeIdx];
    self.seatedIdx = freeIdx;
    self.targetPos = null;
    self.obj.position.set(sp.x, 0.25, sp.z);
    self.obj.rotation.y = Math.atan2(SHRINE_POS.x - sp.x, SHRINE_POS.z - sp.z);
    return true;
  }

  triggerBow(id = this.selfId) {
    const a = this.actors.get(id);
    if (!a) return null;
    a.obj.rotation.y = Math.atan2(SHRINE_POS.x - a.obj.position.x, SHRINE_POS.z - a.obj.position.z);
    a.bowUntil = performance.now() + 1450;
    return a.obj.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  }

  triggerMoktak(id = this.selfId) {
    const a = this.actors.get(id);
    if (!a) return null;
    const now = performance.now();
    a.moktakStrikeAt = now;
    a.moktakUntil = now + 2400;
    return a.obj.position.clone();
  }

  upsertRemotePeer(peer) {
    if (!peer?.id) return;
    let actor = this.actors.get(peer.id);
    if (!actor) {
      actor = this.spawnActor({
        id: peer.id,
        isSelf: false,
        isAI: false,
        name: peer.name || 'Phù Thuỷ Tự Do',
        palette: peer.palette,
        x: peer.x ?? 0,
        z: peer.z ?? 1.4,
        seatedIdx: peer.seatedIdx ?? -1,
      });
    }
    actor.name = peer.name || actor.name;
    actor.seatedIdx = peer.seatedIdx ?? -1;
    actor.targetPos = new THREE.Vector3(peer.x ?? actor.obj.position.x, actor.seatedIdx >= 0 ? 0.25 : 0.02, peer.z ?? actor.obj.position.z);
  }

  removeRemotePeer(id) {
    const actor = this.actors.get(id);
    if (!actor || actor.isSelf || actor.isAI) return;
    this.scene.remove(actor.obj);
    this.actors.delete(id);
  }

  nudgeSelfByKeys(keys, dt, cameraYaw = 0) {
    const self = this.getSelf();
    if (!self) return false;
    let rawVx = 0;
    let rawVz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) rawVz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) rawVz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) rawVx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) rawVx += 1;
    if (rawVx === 0 && rawVz === 0) return false;

    const len = Math.hypot(rawVx, rawVz);
    rawVx /= len;
    rawVz /= len;
    const cosY = Math.cos(cameraYaw);
    const sinY = Math.sin(cameraYaw);
    const vx = rawVx * cosY + rawVz * sinY;
    const vz = -rawVx * sinY + rawVz * cosY;
    const speed = 1.95;
    const rawX = self.obj.position.x + vx * speed * dt;
    const rawZ = self.obj.position.z + vz * speed * dt;
    const { tx: nx, tz: nz } = this.avoidObstacles(rawX, rawZ, -1);

    self.seatedIdx = -1;
    self.targetPos = null;
    self.obj.position.x = nx;
    self.obj.position.z = nz;
    self.walkPhase += dt * 13;
    self.obj.position.y = 0.02 + Math.abs(Math.sin(self.walkPhase)) * 0.055;
    self.obj.rotation.z = Math.sin(self.walkPhase) * 0.075;
    self.obj.rotation.y = Math.atan2(vx, vz);
    return true;
  }

  update(now, dt) {
    // Periodic friendly non-verbal AI bow or zen moktak knock!
    if (now > this.aiNextGestureAt) {
      this.aiNextGestureAt = now + 8200 + Math.random() * 6200;
      const aiList = Array.from(this.actors.values()).filter((a) => a.isAI);
      if (aiList.length > 0) {
        const pick = randomItem(aiList);
        if (Math.random() < 0.55) {
          const p = this.triggerMoktak(pick.id);
          this.onAIMoktak?.(pick.name, p);
        } else {
          this.triggerBow(pick.id);
          this.onBreezeToast?.(pick.name, randomItem(BOW_TOASTS));
        }
      }
    }

    for (const actor of this.actors.values()) {
      if (actor.targetPos) {
        const cur = actor.obj.position;
        const dx = actor.targetPos.x - cur.x;
        const dz = actor.targetPos.z - cur.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.045) {
          const step = Math.min(dist, 1.9 * dt);
          cur.x += (dx / dist) * step;
          cur.z += (dz / dist) * step;
          actor.walkPhase += dt * 13;
          cur.y = 0.02 + Math.abs(Math.sin(actor.walkPhase)) * 0.055;
          actor.obj.rotation.z = Math.sin(actor.walkPhase) * 0.075;
          actor.obj.rotation.y = Math.atan2(dx, dz);
        } else {
          cur.x = actor.targetPos.x;
          cur.z = actor.targetPos.z;
          actor.targetPos = null;
          actor.obj.rotation.z = 0;
          if (actor.targetSeatIdx >= 0) {
            actor.seatedIdx = actor.targetSeatIdx;
            actor.targetSeatIdx = -1;
            cur.y = 0.25;
            actor.obj.rotation.y = Math.atan2(SHRINE_POS.x - cur.x, SHRINE_POS.z - cur.z);
          } else {
            cur.y = 0.02;
          }
        }
      } else if (actor.seatedIdx >= 0) {
        actor.obj.position.y = 0.25 + Math.sin(now * 0.002 + actor.walkPhase) * 0.008;
        actor.obj.rotation.z = 0;
      } else {
        actor.obj.rotation.z *= 0.85;
      }

      // Bow or Moktak strike head nod
      const sinceMoktak = now - actor.moktakStrikeAt;
      if (now < actor.bowUntil) {
        const rem = (actor.bowUntil - now) / 1450;
        actor.obj.rotation.x = Math.sin(rem * Math.PI) * 0.38;
      } else if (sinceMoktak >= 0 && sinceMoktak < 260) {
        actor.obj.rotation.x = Math.sin((sinceMoktak / 260) * Math.PI) * 0.16;
      } else {
        actor.obj.rotation.x *= 0.82;
      }

      // Arcane wand tip flare during bow or moktak strike
      const isCasting = now < actor.bowUntil || (sinceMoktak >= 0 && sinceMoktak < 360);
      if (actor.wandTipMat) {
        actor.wandTipMat.emissiveIntensity = isCasting
          ? 2.85
          : 1.35 + 0.35 * Math.sin(now * 0.0038 + actor.walkPhase);
      }

      // Wizard handheld Moktak & Mallet animation
      if (now < actor.moktakUntil) {
        actor.moktak.root.visible = true;
        if (sinceMoktak >= 0 && sinceMoktak < 340) {
          const t = sinceMoktak / 340;
          // Quick strike down (t=0..0.28) then spring back up
          const swing = t < 0.28
            ? THREE.MathUtils.lerp(-0.42, 0.44, t / 0.28)
            : 0.44 * Math.exp(-(t - 0.28) * 6.5) * Math.cos((t - 0.28) * 14);
          actor.moktak.malletPivot.rotation.z = swing;

          const squash = t > 0.18 && t < 0.72
            ? Math.exp(-(t - 0.18) * 7.0) * Math.sin((t - 0.18) * 18) * 0.18
            : 0;
          actor.moktak.fishBody.scale.set(1.2 * (1 + squash), 0.85 * (1 - squash), 1.05 * (1 + squash));
          actor.moktak.gem.material.emissiveIntensity = 1.4 + Math.max(0, 2.2 * (1 - t));
        } else {
          actor.moktak.malletPivot.rotation.z = -0.18;
          actor.moktak.fishBody.scale.set(1.2, 0.85, 1.05);
          actor.moktak.gem.material.emissiveIntensity = 1.4;
        }
      } else {
        actor.moktak.root.visible = false;
      }
    }
  }

  getOnlineCount() {
    return this.actors.size;
  }

  serializeSelf() {
    const s = this.getSelf();
    if (!s) return null;
    return {
      name: s.name,
      palette: s.palette,
      x: Number(s.obj.position.x.toFixed(3)),
      z: Number(s.obj.position.z.toFixed(3)),
      seatedIdx: s.seatedIdx,
    };
  }
}
