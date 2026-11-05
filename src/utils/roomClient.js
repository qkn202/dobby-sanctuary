import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://fxucyrofcsuqtlkukcrx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zEiG2Py5kDmGhkTgw0uWIA_We0rOCGu';

export class RoomClient {
  constructor({
    roomId = '1',
    onWelcome,
    onPeerState,
    onPeerLeave,
    onPeerGesture,
    onRemoteRitual,
    onBackendStatus,
  }) {
    this.roomId = roomId;
    this.clientId = 'wiz-' + Math.random().toString(36).slice(2, 9);
    this.onWelcome = onWelcome;
    this.onPeerState = onPeerState;
    this.onPeerLeave = onPeerLeave;
    this.onPeerGesture = onPeerGesture;
    this.onRemoteRitual = onRemoteRitual;
    this.onBackendStatus = onBackendStatus;

    this.ws = null;
    this.bc = null;
    this.supabase = null;
    this.sbChannel = null;
    this.supabaseOnline = false;
    this.latestSeq = 0;
    this.lastSelfState = null;
    this.pollTimer = null;

    this.connect();
  }

  connect() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(`dobby-sanctuary-room-${this.roomId}`);
      this.bc.addEventListener('message', (ev) => this.handleMessage(ev.data, true));
    }

    const host = window.location.hostname;
    const isLocalDev = host === 'localhost' || host === '127.0.0.1';

    if (isLocalDev) {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws-sanctuary?room=${encodeURIComponent(this.roomId)}`;
        const ws = new WebSocket(wsUrl);
        this.ws = ws;
        ws.addEventListener('message', (ev) => {
          try {
            this.handleMessage(JSON.parse(ev.data), false);
          } catch {
            // ignore malformed payload
          }
        });
        ws.addEventListener('error', () => {
          this.ws = null;
        });
      } catch {
        this.ws = null;
      }
    }

    this.bootstrapBackend();

    window.addEventListener('pagehide', () => {
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob(
            [
              JSON.stringify({
                action: 'leave',
                room: this.roomId,
                clientId: this.clientId,
              }),
            ],
            { type: 'application/json' },
          );
          navigator.sendBeacon('/api/sanctuary', blob);
        }
      } catch {
        // ignore unload errors
      }
    });
  }

  async bootstrapBackend() {
    try {
      const res = await fetch(
        `/api/sanctuary?room=${encodeURIComponent(this.roomId)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (res.ok) {
        const data = await res.json();
        this.latestSeq = Number(data.latestSeq || 0);
        this.supabaseOnline = Boolean(data.supabaseOnline);
        this.onBackendStatus?.(data);

        if (Array.isArray(data.peers) && data.peers.length > 0) {
          this.onWelcome?.({
            clientId: this.clientId,
            roomId: this.roomId,
            peers: data.peers.filter((p) => p && p.id !== this.clientId),
          });
        }

        if (this.supabaseOnline) {
          this.connectSupabaseRealtime();
        }
      }
    } catch {
      // Backend optional in pure static preview
    }

    this.pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      this.syncPresenceWithBackend();
    }, 2800);
  }

  connectSupabaseRealtime() {
    if (this.sbChannel) return;
    try {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: {
          params: { eventsPerSecond: 20 },
        },
      });

      const channelName = `dobby-sanctuary-room-${this.roomId.toLowerCase()}`;
      this.sbChannel = this.supabase.channel(channelName, {
        config: {
          presence: { key: this.clientId },
          broadcast: { self: false },
        },
      });

      this.sbChannel.on('presence', { event: 'sync' }, () => {
        const presenceState = this.sbChannel?.presenceState() || {};
        for (const [peerKey, list] of Object.entries(presenceState)) {
          if (peerKey === this.clientId || !Array.isArray(list) || !list.length) continue;
          const latest = list[list.length - 1];
          if (latest?.peer) {
            this.onPeerState?.(latest.peer);
          }
        }
      });

      this.sbChannel.on('presence', { event: 'leave' }, ({ key }) => {
        if (key && key !== this.clientId) {
          this.onPeerLeave?.(key);
        }
      });

      this.sbChannel.on('broadcast', { event: 'sanctuary_msg' }, ({ payload }) => {
        if (payload && payload.senderId !== this.clientId) {
          this.handleMessage(payload, false);
        }
      });

      this.sbChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.lastSelfState) {
          try {
            await this.sbChannel.track({
              peer: { ...this.lastSelfState, id: this.clientId },
              onlineAt: Date.now(),
            });
          } catch {
            // ignore track transient error
          }
        }
      });
    } catch {
      this.sbChannel = null;
    }
  }

  async syncPresenceWithBackend() {
    if (!this.lastSelfState) return;
    try {
      const res = await fetch('/api/sanctuary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presence',
          room: this.roomId,
          clientId: this.clientId,
          since: this.latestSeq,
          state: { ...this.lastSelfState, id: this.clientId },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.latestSeq === 'number') {
        this.latestSeq = Math.max(this.latestSeq, data.latestSeq);
      }
      if (data.supabaseOnline && !this.supabaseOnline) {
        this.supabaseOnline = true;
        this.connectSupabaseRealtime();
      }
      this.onBackendStatus?.(data);

      if (Array.isArray(data.peers) && !this.ws && !this.sbChannel) {
        for (const peer of data.peers) {
          if (peer && peer.id !== this.clientId) {
            this.onPeerState?.(peer);
          }
        }
      }

      if (Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (ev.type === 'peer_leave' && ev.clientId && ev.clientId !== this.clientId) {
            this.onPeerLeave?.(ev.clientId);
          } else if (ev.type === 'ritual' && ev.clientId !== this.clientId) {
            this.onRemoteRitual?.(ev);
          }
        }
      }
    } catch {
      // ignore transient network error
    }
  }

  handleMessage(msg, fromBroadcast) {
    if (!msg || (fromBroadcast && msg.senderId === this.clientId)) return;
    if (msg.type === 'welcome') {
      this.clientId = msg.clientId;
      this.onWelcome?.(msg);
    } else if (msg.type === 'peer_state' && msg.peer) {
      if (msg.peer.id !== this.clientId) {
        this.onPeerState?.(msg.peer);
      }
    } else if (msg.type === 'peer_leave' && msg.id) {
      if (msg.id !== this.clientId) {
        this.onPeerLeave?.(msg.id);
      }
    } else if (msg.type === 'peer_gesture') {
      if (msg.id !== this.clientId) {
        this.onPeerGesture?.(msg);
      }
    } else if (msg.type === 'ritual' && msg.clientId !== this.clientId) {
      this.onRemoteRitual?.(msg);
    }
  }

  send(payload) {
    const enriched = { ...payload, senderId: this.clientId };

    if (this.sbChannel && this.sbChannel.state === 'joined') {
      this.sbChannel
        .send({
          type: 'broadcast',
          event: 'sanctuary_msg',
          payload: enriched,
        })
        .catch(() => {});
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }

    if (this.bc) {
      this.bc.postMessage(enriched);
    }
    return false;
  }

  sendState(state) {
    this.lastSelfState = { ...state, id: this.clientId };
    this.send({ type: 'peer_state', peer: this.lastSelfState });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'state', state: this.lastSelfState }));
    }
  }

  sendGesture(kind, blessing = '') {
    this.send({
      type: 'peer_gesture',
      id: this.clientId,
      name: this.lastSelfState?.name || '🧙 Phù Thuỷ Ẩn Danh',
      kind,
      blessing,
    });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'gesture', kind, blessing }));
    }
  }

  async recordRitual({ ritualType, wizardName, summary, meritDelta = 1, meta = {} }) {
    const eventPayload = {
      type: 'ritual',
      clientId: this.clientId,
      wizardName,
      ritualType,
      summary,
      meritDelta,
    };
    this.send(eventPayload);

    try {
      const res = await fetch('/api/sanctuary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ritual',
          room: this.roomId,
          clientId: this.clientId,
          wizardName,
          ritualType,
          summary,
          meritDelta,
          meta,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.onBackendStatus?.(data);
      }
    } catch {
      // non-blocking telemetry
    }
  }
}
