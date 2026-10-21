// Общий прогресс: на странице в Claude — документ в хранилище страницы,
// на сайте и в APK — комната совместной игры (Supabase), если игрок в неё вошёл.
import type { Project } from '../types';
import { connectRoomDoc } from '../multiplayer/room';

interface Snapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
  metadata: { hasPendingWrites: boolean };
}

export interface SharedDoc {
  onSnapshot(next: (snap: Snapshot) => void, error?: (e: { code: string }) => void): () => void;
  set(data: Record<string, unknown>): Promise<void>;
}

interface ClaudeRuntime {
  use(name: string): Promise<{ doc(path: string): SharedDoc } | null>;
}

export async function connectShared(): Promise<SharedDoc | null> {
  const claude = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (!claude?.use) return connectRoomDoc();
  try {
    const db = await claude.use('db');
    return db ? db.doc('shared/project') : null;
  } catch {
    return null;
  }
}

/** Общая часть проекта: без позиции героя, текущего экрана и личных настроек. */
export function sharedJson(p: Project): string {
  return JSON.stringify({ ...p, session: undefined, settings: undefined });
}
