import { Ban, Check, Eye, Lock } from 'lucide-react';
import type { TaskStatus } from '../../types';

/** Маркер над объектом-заданием: «!», кольцо работы, проверка, галочка, замок. */
export function StatusMarker({ status, required }: { status: TaskStatus; required: boolean }) {
  return (
    <span className={`marker m-${status} ${required ? '' : 'optional'}`} aria-hidden>
      {status === 'available' && <b>!</b>}
      {status === 'in_progress' && <span className="ring" />}
      {status === 'review' && <Eye size={14} />}
      {status === 'done' && <Check size={14} strokeWidth={3} />}
      {status === 'locked' && <Lock size={12} />}
      {status === 'skipped' && <Ban size={13} />}
    </span>
  );
}
