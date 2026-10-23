// Транспорт совместной игры: хранение общего прогресса комнаты и живой канал между игроками.
import { SUPABASE_KEY, SUPABASE_URL } from './config';

export interface PeerState {
  id: string;
  name: string;
  color: string;
  view: 'map' | 'island';
  islandId?: string;
}

export interface PeerPos {
  id: string;
  islandId: string;
  x: number;
  y: number;
  flip: boolean;
  walking: boolean;
}

export interface Channel {
  track(state: PeerState): void;
  sendPos(pos: PeerPos): void;
  sendChanged(): void;
  /** Голосования: состояние опроса целиком и просьба прислать известные опросы. */
  sendPoll(poll: unknown): void;
  sendPollHello(): void;
  leave(): void;
}

export interface ChannelHandlers {
  onPeers(peers: PeerState[]): void;
  onPos(pos: PeerPos): void;
  onChanged(): void;
  onPoll?(poll: unknown): void;
  onPollHello?(): void;
  onJoined?(): void;
}

export interface Transport {
  load(room: string): Promise<string | null>;
  save(room: string, json: string): Promise<void>;
  join(room: string, me: string, h: ChannelHandlers): Channel;
}

let cached: Promise<Transport | null> | null = null;

/** Тестовая подмена: window.__coopTransport. Иначе Supabase, если он настроен. */
export function getTransport(): Promise<Transport | null> {
  const fake = (window as unknown as { __coopTransport?: Transport }).__coopTransport;
  if (fake) return Promise.resolve(fake);
  if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.resolve(null);
  cached ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const t: Transport = {
      async load(room) {
        const { data, error } = await client.rpc('get_room', { room_id: room });
        if (error) throw new Error(error.message);
        return typeof data === 'string' ? data : null;
      },
      async save(room, json) {
        const { error } = await client.rpc('save_room', { room_id: room, data: json });
        if (error) throw new Error(error.message);
      },
      join(room, me, h) {
        const ch = client.channel(`room-${room}`, { config: { presence: { key: me }, broadcast: { self: false } } });
        ch.on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState<PeerState>();
          h.onPeers(Object.values(state).flatMap((list) => list.slice(-1)));
        });
        ch.on('broadcast', { event: 'pos' }, ({ payload }) => h.onPos(payload as PeerPos));
        ch.on('broadcast', { event: 'changed' }, () => h.onChanged());
        ch.on('broadcast', { event: 'poll' }, ({ payload }) => h.onPoll?.(payload));
        ch.on('broadcast', { event: 'poll-hello' }, () => h.onPollHello?.());
        let last: PeerState | null = null;
        let joined = false;
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            joined = true;
            if (last) void ch.track(last);
            h.onJoined?.();
          }
        });
        return {
          track(state) {
            last = state;
            if (joined) void ch.track(state);
          },
          sendPos(pos) {
            if (joined) void ch.send({ type: 'broadcast', event: 'pos', payload: pos });
          },
          sendChanged() {
            if (joined) void ch.send({ type: 'broadcast', event: 'changed', payload: {} });
          },
          sendPoll(poll) {
            if (joined) void ch.send({ type: 'broadcast', event: 'poll', payload: poll });
          },
          sendPollHello() {
            if (joined) void ch.send({ type: 'broadcast', event: 'poll-hello', payload: {} });
          },
          leave() {
            void client.removeChannel(ch);
          },
        };
      },
    };
    return t;
  });
  return cached;
}

export const coopConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY) || !!(window as unknown as { __coopTransport?: Transport }).__coopTransport;
