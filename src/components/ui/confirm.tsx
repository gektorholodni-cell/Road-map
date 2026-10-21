import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

export interface ChoiceOption {
  id: string;
  label: string;
  tone?: 'primary' | 'danger' | 'ghost';
}

interface Request {
  title: string;
  message: ReactNode;
  options: ChoiceOption[];
  /** Если задано — пользователь должен ввести это слово для подтверждения. */
  typeToConfirm?: string;
  resolve: (v: string | null) => void;
}

type Choose = (r: Omit<Request, 'resolve'>) => Promise<string | null>;

const Ctx = createContext<Choose | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<Request | null>(null);
  const [typed, setTyped] = useState('');
  const choose = useCallback<Choose>(
    (r) =>
      new Promise((resolve) => {
        setTyped('');
        setReq({ ...r, resolve });
      }),
    [],
  );
  const done = (v: string | null) => {
    req?.resolve(v);
    setReq(null);
  };
  return (
    <Ctx.Provider value={choose}>
      {children}
      {req && (
        <Modal
          title={req.title}
          onClose={() => done(null)}
          className="confirm"
          footer={
            <>
              <button className="btn ghost" onClick={() => done(null)}>
                Отмена
              </button>
              {req.options.map((o) => (
                <button
                  key={o.id}
                  className={`btn ${o.tone ?? 'primary'}`}
                  disabled={!!req.typeToConfirm && typed.trim().toLowerCase() !== req.typeToConfirm.toLowerCase()}
                  onClick={() => done(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </>
          }
        >
          <div className="confirm-msg">{req.message}</div>
          {req.typeToConfirm && (
            <label className="field">
              <span>
                Введите «{req.typeToConfirm}» для подтверждения
              </span>
              <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} />
            </label>
          )}
        </Modal>
      )}
    </Ctx.Provider>
  );
}

export function useChoose(): Choose {
  const c = useContext(Ctx);
  if (!c) throw new Error('useChoose вне ConfirmProvider');
  return c;
}

/** Простое подтверждение «да/нет». */
export function useConfirm() {
  const choose = useChoose();
  return useCallback(
    async (title: string, message: ReactNode, okLabel = 'Подтвердить', danger = false) =>
      (await choose({ title, message, options: [{ id: 'ok', label: okLabel, tone: danger ? 'danger' : 'primary' }] })) === 'ok',
    [choose],
  );
}
