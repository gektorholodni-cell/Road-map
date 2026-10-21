// Камера карты: преобразование мир ↔ экран, ограничения и плавные перелёты.
export interface Camera {
  x: number;
  y: number;
  k: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MIN_K = 0.07;
export const MAX_K = 2.2;

/** Вписывает область в экран с отступами под элементы интерфейса. */
export function fitCamera(bounds: Rect, vw: number, vh: number, inset = { top: 0, right: 0, bottom: 0, left: 0 }): Camera {
  const aw = Math.max(200, vw - inset.left - inset.right);
  const ah = Math.max(200, vh - inset.top - inset.bottom);
  const k = Math.max(MIN_K, Math.min(MAX_K, Math.min(aw / bounds.w, ah / bounds.h) * 0.96));
  const cx = inset.left + aw / 2;
  const cy = inset.top + ah / 2;
  return { k, x: cx - (bounds.x + bounds.w / 2) * k, y: cy - (bounds.y + bounds.h / 2) * k };
}

export function centerOn(wx: number, wy: number, k: number, vw: number, vh: number): Camera {
  return { k, x: vw / 2 - wx * k, y: vh / 2 - wy * k };
}

/** Не даёт увести мир полностью за край экрана. */
export function clampCamera(c: Camera, world: Rect, vw: number, vh: number): Camera {
  const k = Math.max(MIN_K, Math.min(MAX_K, c.k));
  const marginX = vw * 0.4;
  const marginY = vh * 0.4;
  const minX = vw - marginX - (world.x + world.w) * k;
  const maxX = marginX - world.x * k;
  const minY = vh - marginY - (world.y + world.h) * k;
  const maxY = marginY - world.y * k;
  return {
    k,
    x: minX > maxX ? (minX + maxX) / 2 : Math.max(minX, Math.min(maxX, c.x)),
    y: minY > maxY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, c.y)),
  };
}

export function zoomAt(c: Camera, factor: number, sx: number, sy: number): Camera {
  const k = Math.max(MIN_K, Math.min(MAX_K, c.k * factor));
  const f = k / c.k;
  return { k, x: sx - (sx - c.x) * f, y: sy - (sy - c.y) * f };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Плавный перелёт камеры. Возвращает функцию отмены. */
export function animateCamera(from: Camera, to: Camera, ms: number, onFrame: (c: Camera) => void, onDone?: () => void): () => void {
  if (ms <= 0) {
    onFrame(to);
    onDone?.();
    return () => {};
  }
  let raf = 0;
  const start = performance.now();
  // Интерполяция в логарифме масштаба выглядит естественнее при сильном зуме.
  const lk0 = Math.log(from.k);
  const lk1 = Math.log(to.k);
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const e = ease(t);
    const k = Math.exp(lk0 + (lk1 - lk0) * e);
    // Центр экрана в мировых координатах интерполируется линейно.
    onFrame({ k, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
    if (t < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
