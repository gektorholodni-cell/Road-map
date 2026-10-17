// Слой хранения: IndexedDB (проект и резервные копии). Без сети и внешних серверов.
import type { Project } from '../types';

const DB_NAME = 'islands-roadmap';
const DB_VERSION = 1;
const PROJECT_STORE = 'project';
const BACKUP_STORE = 'backups';
const CURRENT_KEY = 'current';

export interface BackupMeta {
  id: string;
  createdAt: string;
  label: string;
  projectName: string;
  done: number;
  total: number;
}

interface BackupRecord extends BackupMeta {
  data: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступен в этом браузере.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) db.createObjectStore(PROJECT_STORE);
      if (!db.objectStoreNames.contains(BACKUP_STORE)) db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Не удалось открыть IndexedDB.'));
    req.onblocked = () => reject(new Error('База данных заблокирована другой вкладкой.'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        let result: T;
        req.onsuccess = () => {
          result = req.result;
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error ?? req.error ?? new Error('Ошибка IndexedDB.'));
        tx.onabort = () => reject(tx.error ?? new Error('Транзакция IndexedDB прервана.'));
      }),
  );
}

/** Возвращает сырые данные проекта (строку JSON) — проверка выполняется в io.ts. */
export async function loadRaw(): Promise<string | null> {
  const v = await run<unknown>(PROJECT_STORE, 'readonly', (s) => s.get(CURRENT_KEY));
  if (v == null) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

export async function saveProject(p: Project): Promise<void> {
  await run(PROJECT_STORE, 'readwrite', (s) => s.put(JSON.stringify(p), CURRENT_KEY));
}

export async function clearProject(): Promise<void> {
  await run(PROJECT_STORE, 'readwrite', (s) => s.delete(CURRENT_KEY));
}

export async function listBackups(): Promise<BackupMeta[]> {
  const all = await run<BackupRecord[]>(BACKUP_STORE, 'readonly', (s) => s.getAll() as IDBRequest<BackupRecord[]>);
  return all
    .map(({ data: _data, ...meta }) => meta)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createBackup(p: Project, label: string, done: number, total: number): Promise<BackupMeta> {
  const rec: BackupRecord = {
    id: `backup-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    label,
    projectName: p.name,
    done,
    total,
    data: JSON.stringify(p),
  };
  await run(BACKUP_STORE, 'readwrite', (s) => s.put(rec));
  const { data: _d, ...meta } = rec;
  return meta;
}

export async function readBackup(id: string): Promise<string | null> {
  const rec = await run<BackupRecord | undefined>(BACKUP_STORE, 'readonly', (s) => s.get(id) as IDBRequest<BackupRecord | undefined>);
  return rec ? rec.data : null;
}

export async function deleteBackup(id: string): Promise<void> {
  await run(BACKUP_STORE, 'readwrite', (s) => s.delete(id));
}
