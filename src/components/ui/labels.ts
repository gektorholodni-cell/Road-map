import type { Priority, StoredStatus, TaskStatus } from '../../types';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  locked: 'Заблокирована',
  available: 'Доступна',
  in_progress: 'В процессе',
  review: 'На проверке',
  done: 'Выполнена',
  skipped: 'Пропущена',
};

export const STORED_STATUS_LABEL: Record<StoredStatus, string> = {
  todo: 'Не начата',
  in_progress: 'В процессе',
  review: 'На проверке',
  done: 'Выполнена',
  skipped: 'Пропущена / отменена',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

export const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const pct = (r: number) => `${Math.round(r * 100)}%`;
