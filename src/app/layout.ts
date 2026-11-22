/**
 * Where the seats go. Seats sit on a squarish ellipse (a superellipse, so a wide screen's corners are used), the
 * viewer at the bottom, the others clockwise from there. The tile size is the largest at which no two seats touch
 * and the middle of the table still has room for the turn stage and the centre cards.
 */
export interface SeatBox { x: number; y: number }
export interface TableLayout { tw: number; th: number; nameH: number; seats: SeatBox[]; cx: number; cy: number; cw: number; ch: number }

const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

export function layoutTable(W: number, H: number, n: number, viewer: number, opts: { nameH?: number; minCentre?: [number, number] } = {}): TableLayout {
  const nameH = opts.nameH ?? 26, pad = 8, gap = 10;
  const [minCW, minCH] = opts.minCentre ?? [Math.min(300, W * 0.42), Math.min(230, H * 0.36)];
  const p = n <= 3 ? 4 : n === 4 ? 2 : 2.7;
  const cx = W / 2, cy = H / 2;
  const maxTw = Math.max(64, Math.min(280, W * 0.25, (H * 0.3) / 0.75));
  let fallback: TableLayout | null = null;
  for (let tw = maxTw; tw >= 56; tw -= 4) {
    const th = tw * 0.75, bw = tw, bh = th + nameH;
    const rx = W / 2 - bw / 2 - pad, ry = H / 2 - bh / 2 - pad;
    if (rx < 30 || ry < 30) continue;
    const seats: SeatBox[] = [];
    for (let i = 0; i < n; i++) {
      const r = ((i - viewer) % n + n) % n;
      const t = Math.PI / 2 + (r * 2 * Math.PI) / n;
      seats.push({ x: cx + rx * spow(Math.cos(t), 2 / p), y: cy + ry * spow(Math.sin(t), 2 / p) });
    }
    let ok = true;
    for (let i = 0; i < n && ok; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(seats[i].x - seats[j].x) < bw + gap && Math.abs(seats[i].y - seats[j].y) < bh + gap) { ok = false; break; }
    }
    if (!ok) continue;
    // The largest centred rectangle clear of every seat, trying a few shapes.
    let best = { a: 0, b: 0 };
    for (const k of [0.55, 0.7, 0.85, 1, 1.2, 1.45]) {
      const A0 = (rx - bw / 2 - gap) * Math.min(1, k), B0 = (ry - bh / 2 - gap) * Math.min(1, 1 / k);
      let lo = 0, hi = 1;
      for (let it = 0; it < 14; it++) {
        const s = (lo + hi) / 2, a = A0 * s, b = B0 * s;
        const clear = seats.every(q => Math.abs(q.x - cx) - bw / 2 - gap >= a || Math.abs(q.y - cy) - bh / 2 - gap >= b);
        if (clear) lo = s; else hi = s;
      }
      if (A0 * lo * B0 * lo > best.a * best.b) best = { a: A0 * lo, b: B0 * lo };
    }
    const out: TableLayout = { tw, th, nameH, seats, cx, cy, cw: best.a * 2, ch: best.b * 2 };
    fallback ??= out;
    if (out.cw >= minCW && out.ch >= minCH) return out;
  }
  if (fallback) return fallback;
  // Too small for anything sensible: shrink to fit regardless.
  const tw = 56, th = 42;
  return { tw, th, nameH, cx, cy, cw: W * 0.4, ch: H * 0.3, seats: Array.from({ length: n }, (_, i) => { const t = Math.PI / 2 + ((((i - viewer) % n + n) % n) * 2 * Math.PI) / n; return { x: cx + (W / 2 - 40) * Math.cos(t), y: cy + (H / 2 - 40) * Math.sin(t) }; }) };
}
