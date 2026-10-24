// Голосование в комнате: всплывающий «совет капитанов» поверх игры, который сворачивается в вымпел у края экрана.
import { useEffect, useRef, useState } from 'react';
import { Anchor, Check, Crown, Flag, Maximize2, Minimize2, Plus, Vote, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../state/store';
import { playSound } from '../../systems/sound';
import { deviceId, usePeers } from '../../multiplayer/room';
import { MAX_OPTIONS, closePoll, currentPoll, dismissResult, onPollEvent, pollViewKey, setMinimized, startPoll, tally, usePollState, vote, type Poll } from '../../multiplayer/polls';

const LETTERS = 'ABCDEF';
const FLAG_COLORS = ['#ffd36b', '#5bc0ff', '#ff8a5b', '#4fe3b0', '#c38bff', '#ff5b9a'];

/** Сигнальный вымпел с буквой варианта. */
function Pennant({ index }: { index: number }) {
  return (
    <svg className="poll-pennant" viewBox="0 0 30 34" aria-hidden>
      <path d="M4 2 V32" stroke="#e8eefc" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4 H27 L21 11 L27 18 H5 Z" fill={FLAG_COLORS[index % FLAG_COLORS.length]} />
      <text x="14" y="15" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0b1026">
        {LETTERS[index]}
      </text>
    </svg>
  );
}

export function PollCreate({ onClose, onCreated = onClose }: { onClose: () => void; onCreated?: () => void }) {
  const { toast } = useStore();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const filled = options.map((o) => o.trim()).filter(Boolean);
  const ready = question.trim().length > 0 && filled.length >= 2;

  const submit = () => {
    if (!ready) return;
    if (startPoll(question, filled)) onCreated();
    else toast('Не получилось начать голосование. Проверьте вопрос и варианты.', 'warn');
  };

  return (
    <Modal onClose={onClose} title={<h2>Новое голосование</h2>} className="poll-create">
      <p className="muted">Все в комнате увидят вопрос на экране и смогут выбрать вариант.</p>
      <label className="field">
        <span>Вопрос</span>
        <input id="poll-question" value={question} maxLength={140} placeholder="Например, какой остров берём следующим?" autoFocus onChange={(e) => setQuestion(e.target.value)} />
      </label>
      <div className="field">
        <span>Варианты</span>
        {options.map((o, i) => (
          <div className="poll-create-opt" key={i}>
            <Pennant index={i} />
            <input
              value={o}
              maxLength={60}
              placeholder={`Вариант ${i + 1}`}
              aria-label={`Вариант ${i + 1}`}
              onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {options.length > 2 && (
              <button className="icon-btn small" aria-label={`Убрать вариант ${i + 1}`} title="Убрать" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                <X size={15} />
              </button>
            )}
          </div>
        ))}
        {options.length < MAX_OPTIONS && (
          <button className="btn ghost small poll-add" onClick={() => setOptions([...options, ''])}>
            <Plus size={15} /> Добавить вариант
          </button>
        )}
      </div>
      <div className="btn-row">
        <button className="btn primary" disabled={!ready} onClick={submit}>
          <Flag size={16} /> Поднять флаг голосования
        </button>
      </div>
    </Modal>
  );
}

function PollCard({ poll, online, onMinimize }: { poll: Poll; online: number; onMinimize: () => void }) {
  const peers = usePeers();
  const t = tally(poll);
  const mine = poll.votes[deviceId]?.option;
  const closed = !!poll.closedAt;
  const authorHere = poll.by.id === deviceId || peers.some((p) => p.id === poll.by.id);
  const canClose = !closed && (poll.by.id === deviceId || !authorHere);
  const winner = closed && t.leaders.length === 1 ? t.leaders[0] : -1;

  return (
    <>
      <header className="poll-head">
        <div className="poll-kicker">
          <Anchor size={14} /> {closed ? 'Совет завершён' : 'Совет капитанов'}
        </div>
        <button className="icon-btn small" onClick={onMinimize} aria-label="Свернуть голосование" title="Свернуть">
          <Minimize2 size={16} />
        </button>
      </header>
      <h2 className="poll-question">{poll.question}</h2>
      <div className="poll-by muted small">
        <i style={{ background: poll.by.color }} /> предложил(а) {poll.by.id === deviceId ? 'вы' : poll.by.name}
      </div>

      {closed && (
        <div className={`poll-verdict ${winner >= 0 ? 'win' : ''}`}>
          {winner >= 0 ? (
            <>
              <Crown size={18} /> Решено: <b>{poll.options[winner]}</b>
            </>
          ) : t.total === 0 ? (
            'Никто не проголосовал'
          ) : (
            <>Ничья: {t.leaders.map((i) => poll.options[i]).join(' / ')}</>
          )}
        </div>
      )}

      <ul className="poll-options">
        {poll.options.map((label, i) => {
          const share = t.total ? t.counts[i] / t.total : 0;
          const voters = Object.entries(poll.votes).filter(([, v]) => v.option === i);
          return (
            <li key={i}>
              <button
                className={`poll-option ${mine === i ? 'mine' : ''} ${winner === i ? 'winner' : ''}`}
                disabled={closed}
                aria-pressed={mine === i}
                onClick={() => {
                  if (mine === i) return;
                  vote(poll, i);
                  playSound('click');
                }}
              >
                <span className="poll-water" style={{ width: `${share * 100}%`, ['--flag' as string]: FLAG_COLORS[i % FLAG_COLORS.length] }} />
                <Pennant index={i} />
                <span className="poll-label">{label}</span>
                <span className="poll-voters" aria-hidden>
                  {voters.slice(0, 5).map(([id, v]) => (
                    <i key={id} style={{ background: v.color }} title={v.name} />
                  ))}
                </span>
                <span className="poll-count">{t.counts[i]}</span>
                {mine === i && <Check className="poll-check" size={16} aria-label="Ваш выбор" />}
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="poll-foot">
        <span className="muted small">
          Проголосовали {t.total} из {Math.max(online, t.total)}
          {!closed && mine === undefined && ' · выберите вариант'}
        </span>
        <div className="poll-actions">
          {canClose && (
            <button className="btn small" onClick={() => closePoll(poll)}>
              <Flag size={14} /> Подвести итог
            </button>
          )}
          {closed ? (
            <button className="btn primary small" onClick={() => dismissResult(poll)}>
              Понятно
            </button>
          ) : (
            <button className="btn ghost small" onClick={onMinimize}>
              Свернуть
            </button>
          )}
        </div>
      </footer>
    </>
  );
}

/** Окно голосования поверх игры и вымпел у левого края, в который оно сворачивается. */
export function PollDock({ soundOn }: { soundOn: boolean }) {
  const s = usePollState();
  const peers = usePeers();
  const [creating, setCreating] = useState(false);
  const poll = currentPoll(s);
  // Последний показанный опрос держим, пока окно плавно закрывается.
  const [shown, setShown] = useState<Poll | null>(poll);
  const open = !!poll && !s.minimized[pollViewKey(poll)];
  const cardRef = useRef<HTMLElement>(null);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useEffect(() => {
    if (poll) {
      setShown(poll);
      return;
    }
    const t = window.setTimeout(() => setShown(null), 450);
    return () => window.clearTimeout(t);
  }, [poll]);

  useEffect(
    () =>
      onPollEvent((_, kind) => {
        if (soundRef.current) playSound(kind === 'new' ? 'unlock' : 'fanfare');
      }),
    [],
  );

  // Свёрнутое окно не должно ловить фокус клавиатурой.
  useEffect(() => {
    cardRef.current?.toggleAttribute('inert', !open);
  }, [open]);

  // Esc сворачивает окно и не доходит до игры.
  useEffect(() => {
    if (!open || !poll) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[data-modal]')) return;
      e.stopPropagation();
      setMinimized(poll, true);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, poll]);

  const card = poll ?? shown;
  const t = poll ? tally(poll) : null;
  const waiting = !!poll && !poll.closedAt && poll.votes[deviceId] === undefined;

  return (
    <>
      <div className={`poll-backdrop ${open ? 'open' : ''}`} onMouseDown={() => poll && setMinimized(poll, true)} aria-hidden />
      <section ref={cardRef} className={`poll-card glass ${open ? 'open' : ''} ${card?.closedAt ? 'closed' : ''}`} role="dialog" aria-label="Голосование" aria-hidden={!open}>
        {card && <PollCard poll={card} online={peers.length + 1} onMinimize={() => poll && setMinimized(poll, true)} />}
      </section>

      <button
        className={`poll-pill glass ${poll && !open ? 'show' : ''} ${waiting ? 'waiting' : ''} ${poll?.closedAt ? 'done' : ''}`}
        onClick={() => poll && setMinimized(poll, false)}
        aria-label="Развернуть голосование"
        tabIndex={poll && !open ? 0 : -1}
      >
        <span className="poll-pill-flag">
          <Vote size={18} />
        </span>
        <span className="poll-pill-text">
          <b>{poll?.closedAt ? 'Итоги' : 'Голосование'}</b>
          <span>{poll?.question}</span>
        </span>
        {t && <span className="poll-pill-count">{t.total}</span>}
        <Maximize2 size={14} className="poll-pill-open" />
      </button>

      <button className={`poll-start glass ${poll ? '' : 'show'}`} onClick={() => setCreating(true)} aria-label="Начать голосование" title="Начать голосование" tabIndex={poll ? -1 : 0}>
        <Vote size={18} />
        <span>Голосование</span>
      </button>

      {creating && <PollCreate onClose={() => setCreating(false)} />}
    </>
  );
}
