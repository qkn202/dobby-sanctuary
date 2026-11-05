import { createClient } from '@supabase/supabase-js';
import { pickOracleItem } from '../src/data/fortunes.js';

const FALLBACK_SUPABASE_URL = 'https://fxucyrofcsuqtlkukcrx.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_zEiG2Py5kDmGhkTgw0uWIA_We0rOCGu';

const PEER_TTL_MS = 28_000;
const HEALTH_CACHE_TTL_MS = 25_000;
const MAX_ROOM_EVENTS = 36;

function getMemoryStore() {
  if (!globalThis.__DOBBY_SANCTUARY_STORE__) {
    globalThis.__DOBBY_SANCTUARY_STORE__ = {
      seq: 1,
      rooms: new Map(),
      healthCache: {
        checkedAt: 0,
        online: false,
        tablesReady: false,
        projectRef: 'fxucyrofcsuqtlkukcrx',
      },
      supabaseClient: null,
      supabaseBoundUrl: '',
    };
  }
  return globalThis.__DOBBY_SANCTUARY_STORE__;
}

export function resolveSupabaseConfig(env = process.env) {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
  const anonKey = (
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY
  ).trim();
  let projectRef = 'fxucyrofcsuqtlkukcrx';
  try {
    projectRef = new URL(url).hostname.split('.')[0] || projectRef;
  } catch {
    // keep default ref
  }
  return { url, anonKey, projectRef };
}

function getSupabaseServerClient(env = process.env) {
  const store = getMemoryStore();
  const { url, anonKey } = resolveSupabaseConfig(env);
  if (!store.supabaseClient || store.supabaseBoundUrl !== url) {
    store.supabaseClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    store.supabaseBoundUrl = url;
  }
  return store.supabaseClient;
}

function ensureRoomBucket(roomId = '1') {
  const store = getMemoryStore();
  const code = String(roomId || '1').slice(0, 32);
  if (!store.rooms.has(code)) {
    store.rooms.set(code, {
      roomCode: code,
      stats: {
        totalMerit: 108,
        totalMoktak: 108,
        totalBows: 18,
        totalOracles: 24,
      },
      peers: new Map(),
      events: [],
    });
  }
  const bucket = store.rooms.get(code);
  const now = Date.now();
  for (const [peerId, entry] of bucket.peers.entries()) {
    if (now - entry.updatedAt > PEER_TTL_MS) {
      bucket.peers.delete(peerId);
    }
  }
  return bucket;
}

export async function checkSupabaseHealth(env = process.env) {
  const store = getMemoryStore();
  const { url, anonKey, projectRef } = resolveSupabaseConfig(env);
  const now = Date.now();

  if (now - store.healthCache.checkedAt < HEALTH_CACHE_TTL_MS) {
    return store.healthCache;
  }

  let online = false;
  let tablesReady = false;

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(1800),
    });
    online = res.status > 0 && res.status < 500;
  } catch {
    online = false;
  }

  if (online) {
    try {
      const sb = getSupabaseServerClient(env);
      const { error } = await sb
        .from('dobby_sanctuary_stats')
        .select('room_code')
        .limit(1);
      tablesReady = !error;
    } catch {
      tablesReady = false;
    }
  }

  store.healthCache = {
    checkedAt: now,
    online,
    tablesReady,
    projectRef,
  };
  return store.healthCache;
}

async function syncStatsWithSupabase(bucket, health, env = process.env, writeDelta = false) {
  if (!health.online || !health.tablesReady) return bucket.stats;
  const sb = getSupabaseServerClient(env);

  try {
    if (writeDelta) {
      await sb.from('dobby_sanctuary_stats').upsert(
        {
          room_code: bucket.roomCode,
          total_merit: bucket.stats.totalMerit,
          total_moktak: bucket.stats.totalMoktak,
          total_bows: bucket.stats.totalBows,
          total_oracles: bucket.stats.totalOracles,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_code' },
      );
    } else {
      const { data } = await sb
        .from('dobby_sanctuary_stats')
        .select('*')
        .eq('room_code', bucket.roomCode)
        .maybeSingle();
      if (data) {
        bucket.stats.totalMerit = Math.max(bucket.stats.totalMerit, Number(data.total_merit || 108));
        bucket.stats.totalMoktak = Math.max(bucket.stats.totalMoktak, Number(data.total_moktak || 108));
        bucket.stats.totalBows = Math.max(bucket.stats.totalBows, Number(data.total_bows || 18));
        bucket.stats.totalOracles = Math.max(
          bucket.stats.totalOracles,
          Number(data.total_oracles || 24),
        );
      }
    }
  } catch {
    // keep warm memory stats on transient DB error
  }

  return bucket.stats;
}

function appendRoomEvent(bucket, eventPayload) {
  const store = getMemoryStore();
  const item = {
    seq: store.seq++,
    createdAt: new Date().toISOString(),
    ...eventPayload,
  };
  bucket.events.push(item);
  if (bucket.events.length > MAX_ROOM_EVENTS) {
    bucket.events.splice(0, bucket.events.length - MAX_ROOM_EVENTS);
  }
  return item;
}

export async function handleSanctuaryRequest({ method, query = {}, body = {}, env = process.env }) {
  const roomCode = String(query.room || body.room || '1').slice(0, 32);
  const sinceSeq = Number(query.since || body.since || 0);
  const bucket = ensureRoomBucket(roomCode);
  const health = await checkSupabaseHealth(env);
  const { url: supabaseUrl } = resolveSupabaseConfig(env);

  if (method === 'GET') {
    await syncStatsWithSupabase(bucket, health, env, false);
    const peers = Array.from(bucket.peers.values()).map((p) => p.state);
    const events = bucket.events.filter((ev) => ev.seq > sinceSeq);
    const latestSeq = bucket.events.length
      ? bucket.events[bucket.events.length - 1].seq
      : sinceSeq;

    return {
      status: 200,
      payload: {
        ok: true,
        roomCode,
        projectRef: health.projectRef,
        supabaseUrl,
        supabaseOnline: health.online,
        supabaseTablesReady: health.tablesReady,
        backendMode: health.online ? 'supabase-cloud' : 'vercel-serverless-edge',
        stats: bucket.stats,
        peers,
        events,
        latestSeq,
      },
    };
  }

  if (method !== 'POST') {
    return {
      status: 405,
      payload: { ok: false, error: 'Method Not Allowed' },
    };
  }

  const action = String(body.action || 'presence');
  const clientId = String(body.clientId || '').slice(0, 64);

  if (action === 'presence' && clientId && body.state && typeof body.state === 'object') {
    const cleanState = {
      ...body.state,
      id: clientId,
      name: String(body.state.name || '🧙 Phù Thuỷ Trốn Họp').slice(0, 60),
    };
    bucket.peers.set(clientId, {
      id: clientId,
      state: cleanState,
      updatedAt: Date.now(),
    });

    if (health.online && health.tablesReady) {
      const sb = getSupabaseServerClient(env);
      sb.from('dobby_room_peers')
        .upsert(
          {
            id: clientId,
            room_code: roomCode,
            wizard_name: cleanState.name,
            state_json: cleanState,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'id,room_code' },
        )
        .then(() => {})
        .catch(() => {});
    }

    const peers = Array.from(bucket.peers.values())
      .filter((p) => p.id !== clientId)
      .map((p) => p.state);
    const events = bucket.events.filter((ev) => ev.seq > sinceSeq && ev.clientId !== clientId);
    const latestSeq = bucket.events.length
      ? bucket.events[bucket.events.length - 1].seq
      : sinceSeq;

    return {
      status: 200,
      payload: {
        ok: true,
        supabaseOnline: health.online,
        stats: bucket.stats,
        peers,
        events,
        latestSeq,
      },
    };
  }

  if (action === 'leave' && clientId) {
    bucket.peers.delete(clientId);
    appendRoomEvent(bucket, {
      type: 'peer_leave',
      clientId,
    });
    if (health.online && health.tablesReady) {
      const sb = getSupabaseServerClient(env);
      sb.from('dobby_room_peers')
        .delete()
        .eq('id', clientId)
        .eq('room_code', roomCode)
        .then(() => {})
        .catch(() => {});
    }
    return { status: 200, payload: { ok: true } };
  }

  if (action === 'ritual') {
    const ritualType = String(body.ritualType || 'moktak').slice(0, 32);
    const wizardName = String(body.wizardName || '🧙 Phù Thuỷ Ẩn Danh').slice(0, 60);
    const summary = String(body.summary || '').slice(0, 240);
    const meritDelta = Math.max(0, Math.min(20, Number(body.meritDelta ?? 1)));

    bucket.stats.totalMerit += meritDelta;
    if (ritualType === 'moktak' || ritualType === 'moktak_108') {
      bucket.stats.totalMoktak += 1;
    } else if (ritualType === 'bow') {
      bucket.stats.totalBows += 1;
    } else if (ritualType === 'food' || ritualType === 'place' || ritualType === 'tuvi') {
      bucket.stats.totalOracles += 1;
    }

    const ev = appendRoomEvent(bucket, {
      type: 'ritual',
      clientId,
      wizardName,
      ritualType,
      summary,
      meritDelta,
    });

    if (health.online && health.tablesReady) {
      const sb = getSupabaseServerClient(env);
      await Promise.allSettled([
        syncStatsWithSupabase(bucket, health, env, true),
        sb.from('dobby_oracle_logs').insert({
          room_code: roomCode,
          client_id: clientId || 'anon',
          wizard_name: wizardName,
          ritual_type: ritualType,
          summary: summary || ritualType,
          merit_delta: meritDelta,
          meta: body.meta && typeof body.meta === 'object' ? body.meta : {},
        }),
      ]);
    }

    return {
      status: 200,
      payload: {
        ok: true,
        event: ev,
        stats: bucket.stats,
        supabaseOnline: health.online,
      },
    };
  }

  if (action === 'draw_oracle') {
    const mode = body.mode === 'place' ? 'place' : 'food';
    const budget = ['low', 'mid', 'high'].includes(body.budget) ? body.budget : 'mid';
    const company = ['solo', 'couple', 'group'].includes(body.company) ? body.company : 'solo';
    const excludeId = body.excludeId ? String(body.excludeId) : null;
    const item = pickOracleItem(mode, budget, company, excludeId);

    bucket.stats.totalMerit += 1;
    bucket.stats.totalOracles += 1;
    const wizardName = String(body.wizardName || '🧙 Phù Thuỷ Trốn Họp').slice(0, 60);
    const summary = `vừa xin quẻ ${mode === 'place' ? 'Hôm nay đi đâu' : 'Hôm nay ăn gì'}: ${item.title}`;

    const ev = appendRoomEvent(bucket, {
      type: 'ritual',
      clientId,
      wizardName,
      ritualType: mode,
      summary,
      meritDelta: 1,
    });

    if (health.online && health.tablesReady) {
      const sb = getSupabaseServerClient(env);
      await Promise.allSettled([
        syncStatsWithSupabase(bucket, health, env, true),
        sb.from('dobby_oracle_logs').insert({
          room_code: roomCode,
          client_id: clientId || 'anon',
          wizard_name: wizardName,
          ritual_type: mode,
          summary,
          merit_delta: 1,
          meta: { itemId: item.id, budget, company },
        }),
      ]);
    }

    return {
      status: 200,
      payload: {
        ok: true,
        item,
        event: ev,
        stats: bucket.stats,
        supabaseOnline: health.online,
      },
    };
  }

  return {
    status: 400,
    payload: { ok: false, error: `Unsupported action: ${action}` },
  };
}
