// Комната совместной игры: кто сейчас в игре, где их герои и общий документ прогресса.
import { useSyncExternalStore } from 'react';
import type { SharedDoc } from '../storage/shared';
import { getTransport, type Channel, type PeerPos, type PeerState } from './transport';

const KEY = 'islands-roadmap-coop';
const COLORS = ['#ff8a5b', '#5bc0ff', '#c38bff', '#ffd25b', '#5bffb0', '#ff5b9a'];

export interface CoopSettings {
  room: string;
  name: string;
  color: string;
}

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/** Постоянный идентификатор этого устройства. */
export const deviceId = (() => {
  let id: string | null = null;
  try {
    id = localStorage.getItem(`${KEY}-device`);
    if (!id) {
      id = `p-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(`${KEY}-device`, id);
    }
  } catch {
    id ??= `p-${Math.random().toString(36).slice(2, 10)}`;
  }
  return id;
})();

export function coopSettings(): CoopSettings | null {
  const s = readJson<CoopSettings>(KEY);
  return s && typeof s.room === 'string' && s.room ? s : null;
}

export function saveCoopSettings(s: CoopSettings | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* без хранилища комната живёт до перезагрузки */
  }
}

export const newRoomCode = () => {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
};

export const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

/** Ссылка-приглашение: друг открывает её и попадает в ту же комнату. */
const SITE = 'https://gektorholodni-cell.github.io/Road-map/';
export const inviteLink = (room: string) => (location.protocol === 'https:' && !location.host.endsWith('androidplatform.net') ? `${location.origin}${location.pathname}` : SITE) + `#room=${room}`;

/** Код комнаты из адреса (#room=…), если по ссылке пришли. */
export function roomFromHash(): string | null {
  const m = /room=([a-z0-9]{8,32})/i.exec(location.hash);
  return m ? m[1].toLowerCase() : null;
}

// ----- Живое состояние комнаты -----
type Listener = () => void;
const listeners = new Set<Listener>();
let peers: PeerState[] = [];
const positions = new Map<string, PeerPos>();
let channel: Channel | null = null;
let me: PeerState | null = null;
let changedHandler: (() => void) | null = null;

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Другие игроки в комнате (без себя). */
export function usePeers(): PeerState[] {
  return useSyncExternalStore(subscribe, () => peers);
}

export function peerPositions(): ReadonlyMap<string, PeerPos> {
  return positions;
}

export function onPositions(fn: Listener) {
  return subscribe(fn);
}

async function ensureChannel(): Promise<Channel | null> {
  if (channel) return channel;
  const s = coopSettings();
  if (!s) return null;
  const t = await getTransport();
  if (!t || channel) return channel;
  channel = t.join(s.room, deviceId, {
    onPeers(list) {
      const others = list.filter((p) => p.id !== deviceId);
      for (const id of positions.keys()) if (!others.some((p) => p.id === id)) positions.delete(id);
      peers = others;
      emit();
    },
    onPos(pos) {
      if (pos.id === deviceId) return;
      positions.set(pos.id, pos);
      emit();
    },
    onChanged() {
      changedHandler?.();
    },
  });
  if (me) channel.track(me);
  return channel;
}

/** Сообщает остальным, где вы: на карте или на острове. */
export function setPresence(view: 'map' | 'island', islandId?: string) {
  const s = coopSettings();
  if (!s) return;
  me = { id: deviceId, name: s.name, color: s.color, view, islandId };
  void ensureChannel().then((ch) => ch?.track(me!));
}

let lastSent = 0;
let lastKey = '';
/** Позиция героя на острове; отправляется не чаще 8 раз в секунду и только при изменении. */
export function sendPosition(islandId: string, x: number, y: number, flip: boolean, walking: boolean) {
  if (!channel) return;
  const now = performance.now();
  const key = `${islandId}:${Math.round(x)}:${Math.round(y)}:${flip}:${walking}`;
  if (key === lastKey || now - lastSent < 120) return;
  lastSent = now;
  lastKey = key;
  channel.sendPos({ id: deviceId, islandId, x: Math.round(x), y: Math.round(y), flip, walking });
}

/** Общий прогресс комнаты в виде документа, совместимого с хранилищем страницы в Claude. */
export async function connectRoomDoc(): Promise<SharedDoc | null> {
  const s = coopSettings();
  if (!s) return null;
  const t = await getTransport();
  if (!t) return null;
  const ch = await ensureChannel();
  return {
    onSnapshot(next) {
      let alive = true;
      const load = async () => {
        try {
          const json = await t.load(s.room);
          if (alive) next({ exists: json !== null, data: () => (json === null ? undefined : { json }), metadata: { hasPendingWrites: false } });
        } catch {
          // Сеть пропала — повторим при следующем сигнале или по таймеру.
        }
      };
      changedHandler = () => void load();
      void load();
      // Запасное обновление, если сигнал об изменении потерялся.
      const timer = window.setInterval(() => void load(), 20000);
      return () => {
        alive = false;
        changedHandler = null;
        window.clearInterval(timer);
      };
    },
    async set(data) {
      await t.save(s.room, String(data.json));
      ch?.sendChanged();
    },
  };
}

export function leaveRoom() {
  channel?.leave();
  channel = null;
  peers = [];
  positions.clear();
  saveCoopSettings(null);
  emit();
}
