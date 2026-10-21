// Совместная игра: создать комнату, пригласить друга по ссылке, видеть, кто сейчас в игре.
import { useState } from 'react';
import { Copy, LogIn, LogOut, Plus, Users } from 'lucide-react';
import { useStore } from '../../state/store';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../ui/confirm';
import { createBackup } from '../../storage/db';
import { projectProgress } from '../../systems/progress';
import { coopConfigured } from '../../multiplayer/transport';
import { coopSettings, inviteLink, leaveRoom, newRoomCode, randomColor, roomFromHash, saveCoopSettings, usePeers } from '../../multiplayer/room';

const isClaudePage = () => !!(window as unknown as { claude?: unknown }).claude;

/** Перезагрузка подключает общий прогресс комнаты с чистого состояния. */
const reloadWithoutHash = () => {
  history.replaceState(null, '', location.pathname + location.search);
  location.reload();
};

export function CoopPanel({ onClose }: { onClose: () => void }) {
  const { project, project: { islands }, toast } = useStore();
  const confirm = useConfirm();
  const peers = usePeers();
  const current = coopSettings();
  const invited = roomFromHash();
  const [name, setName] = useState(current?.name ?? '');
  const [code, setCode] = useState(invited ?? '');

  if (isClaudePage()) {
    return (
      <Modal onClose={onClose} title={<h2>Совместная игра</h2>}>
        <p>На этой странице прогресс уже общий для всех, кому вы открыли доступ через меню «Поделиться».</p>
      </Modal>
    );
  }
  if (!coopConfigured()) {
    return (
      <Modal onClose={onClose} title={<h2>Совместная игра</h2>}>
        <p>Сервер для совместной игры ещё не подключён. Пока прогресс хранится только на этом устройстве.</p>
      </Modal>
    );
  }

  const playerName = name.trim() || 'Игрок';

  const create = () => {
    saveCoopSettings({ room: newRoomCode(), name: playerName, color: current?.color ?? randomColor() });
    reloadWithoutHash();
  };

  const join = async () => {
    const room = code.trim().toLowerCase().replace(/^.*room=/, '');
    if (!/^[a-z0-9]{8,32}$/.test(room)) {
      toast('Код комнаты — от 8 латинских букв и цифр. Проще всего открыть ссылку-приглашение.', 'warn');
      return;
    }
    const ok = await confirm(
      'Войти в комнату?',
      <p>Прогресс на этом устройстве заменится общим прогрессом комнаты. Перед этим будет создана резервная копия, её можно восстановить в настройках.</p>,
      'Войти',
    );
    if (!ok) return;
    try {
      const p = projectProgress(project);
      await createBackup(project, 'Автоматически перед входом в комнату', p.done, p.total);
    } catch {
      /* копия не обязательна */
    }
    saveCoopSettings({ room, name: playerName, color: current?.color ?? randomColor() });
    reloadWithoutHash();
  };

  const leave = async () => {
    const ok = await confirm('Выйти из комнаты?', <p>Прогресс останется на этом устройстве, но перестанет обновляться вместе с другом.</p>, 'Выйти');
    if (!ok) return;
    leaveRoom();
    reloadWithoutHash();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Ссылка скопирована.', 'success');
    } catch {
      toast('Не удалось скопировать — выделите ссылку и скопируйте вручную.', 'warn');
    }
  };

  const where = (islandId?: string) => {
    const i = islandId ? islands.findIndex((x) => x.id === islandId) : -1;
    return i >= 0 ? `на острове ${i + 1} · ${islands[i].name}` : 'на карте';
  };

  if (current && current.room !== invited) {
    const link = inviteLink(current.room);
    return (
      <Modal onClose={onClose} title={<h2>Совместная игра</h2>} className="coop">
        <section>
          <h3>Пригласить друга</h3>
          <p className="muted">Отправьте ссылку. Кто её откроет, будет видеть общий прогресс и вашего героя.</p>
          <div className="coop-link">
            <input id="coop-link" readOnly value={link} onFocus={(e) => e.target.select()} />
            <button className="btn primary" onClick={() => void copy(link)}>
              <Copy size={16} /> Копировать
            </button>
          </div>
        </section>
        <section>
          <h3>Сейчас в игре</h3>
          <ul className="coop-peers">
            <li>
              <i style={{ background: current.color }} /> {current.name} (вы)
            </li>
            {peers.map((p) => (
              <li key={p.id}>
                <i style={{ background: p.color }} /> {p.name} <span className="muted">{where(p.view === 'island' ? p.islandId : undefined)}</span>
              </li>
            ))}
            {peers.length === 0 && <li className="muted">Друзей пока нет онлайн.</li>}
          </ul>
        </section>
        <div className="btn-row">
          <button className="btn ghost" onClick={() => void leave()}>
            <LogOut size={16} /> Выйти из комнаты
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title={<h2>Совместная игра</h2>} className="coop">
      <p className="muted">
        <Users size={15} /> Играйте вместе: общий прогресс задач и герои друг друга на островах.
      </p>
      <label className="field">
        <span>Ваше имя</span>
        <input id="coop-name" value={name} maxLength={24} placeholder="Например, Айдын" onChange={(e) => setName(e.target.value)} />
      </label>
      {invited ? (
        <div className="btn-row">
          <button className="btn primary" onClick={() => void join()}>
            <LogIn size={16} /> Войти в комнату друга
          </button>
        </div>
      ) : (
        <>
          <div className="btn-row">
            <button className="btn primary" onClick={create}>
              <Plus size={16} /> Создать комнату
            </button>
          </div>
          <p className="muted small">В комнату попадёт ваш текущий прогресс. После создания появится ссылка для друга.</p>
          <label className="field">
            <span>Или войдите по коду или ссылке</span>
            <div className="coop-link">
              <input id="coop-code" value={code} placeholder="Код комнаты" onChange={(e) => setCode(e.target.value)} />
              <button className="btn ghost" onClick={() => void join()}>
                <LogIn size={16} /> Войти
              </button>
            </div>
          </label>
        </>
      )}
    </Modal>
  );
}
