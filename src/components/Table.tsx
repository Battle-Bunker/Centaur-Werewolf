/**
 * The table: every player on a ring in seat order, you at the bottom, the centre cards in the middle with the night's
 * current turn staged above them. It takes most of the screen on purpose. Each seat's `.seat-media` box is a 4:3
 * tile that holds an avatar today and will hold that player's video later; hovering a seat (and, later, speaking)
 * enlarges it.
 *
 * Seats and centre cards become buttons when something is being chosen (a night target, a vote): the side panel or
 * the day phase publishes a `picker`, and the table only shows it.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ROLE, roleName, sameSlot, slotKey, type RoleId, type Slot } from "../../shared/roles";
import { markersFor, type Marker } from "../app/knowledge";
import { layoutTable, type TableLayout } from "../app/layout";
import { useApp, type Picker, type View } from "../app/store";
import { Avatar, Card } from "./bits";
import { CentreStage } from "./CentreStage";
import { IconBot, IconCheck, IconCrown, IconEye } from "./icons";

export function Table() {
  const { view, picker, exec } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const v = view!;
  const game = v.game, mine = game?.mine ?? null, final = game?.final ?? null;
  const n = v.players.length;
  const viewer = mine?.seat ?? Math.max(0, v.players.findIndex(p => p.me));
  const L = useMemo(() => (size.w ? layoutTable(size.w, size.h, Math.max(1, n), viewer, { nameH: size.w < 560 ? 22 : 28 }) : null), [size.w, size.h, n, viewer]);

  const markers = useMemo(() => markersFor(v, mine?.journal ?? [], mine?.seat ?? -1), [v, mine?.journal, mine?.seat]);

  // During the day the table itself is the ballot.
  const ballot: Picker | null = v.phase === "day" && mine ? {
    legal: v.players.filter(p => p.seat !== mine.seat).map(p => ({ k: "p" as const, i: p.seat })),
    chosen: mine.vote !== null ? [{ k: "p", i: mine.vote }] : [],
    hint: mine.vote === null ? "Click a player to vote for them." : `You voted for ${v.players[mine.vote]?.name}. Click someone else to change it.`,
    onPick: s => { if (s.i !== mine.vote) void exec("day.vote", { seat: s.i }).catch(() => {}); },
  } : null;
  const pick = v.phase === "night" ? picker : ballot;
  const legal = (s: Slot) => !!pick?.legal.some(l => sameSlot(l, s));
  const order = (s: Slot) => pick ? pick.chosen.findIndex(l => sameSlot(l, s)) : -1;

  const bubbles = useBubbles(v);
  const myTurnRole = mine ? mine.dealt : null;
  const awake = v.phase === "night" && !!game && game.turn > 0 && game.turns[game.turn]?.role === myTurnRole && !!mine && !mine.progress.done;
  // The deal: cards fly from the middle to each seat when a round has just begun.
  const fresh = v.phase === "night" && !!game && game.turn === 0 && Date.now() - game.turns[0].startsAt < 2500;

  const arrows = useMemo(() => {
    if (!L) return [];
    if (final) return final.votes.flatMap((t, i) => (t === null ? [] : [{ from: i, to: t, mine: i === mine?.seat, forced: final.forcedVotes.includes(i) }]));
    if (v.phase === "day" && mine && mine.vote !== null) return [{ from: mine.seat, to: mine.vote, mine: true, forced: false }];
    return [];
  }, [L, final, v.phase, mine]);

  return (
    <div className={`table${awake ? " is-awake" : ""}${pick ? " is-picking" : ""}`} ref={box} aria-label="The table">
      {L && (
        <>
          <div className="felt" style={{ left: L.cx, top: L.cy, width: Math.max(160, (size.w - L.tw * 0.9)), height: Math.max(120, (size.h - L.th * 0.9)) }} aria-hidden />
          <div className="centre" style={{ left: L.cx - L.cw / 2, top: L.cy - L.ch / 2, width: L.cw, height: L.ch }}>
            <CentreStage w={L.cw} h={L.ch} pick={pick} legal={legal} order={order} markers={markers} fresh={fresh} />
          </div>
          {arrows.length > 0 && <VoteArrows L={L} arrows={arrows} reveal={!!final} />}
          {v.players.map((p, idx) => {
            const s: Slot = { k: "p", i: p.seat };
            const pos = L.seats[p.seat] ?? L.seats[idx];
            return (
              <Seat key={p.id} v={v} p={p} pos={pos} L={L} legal={legal(s)} order={order(s)} onPick={() => pick?.onPick(s)} marks={markers[slotKey(s)] ?? []}
                bubble={bubbles[p.seat]} awake={awake && p.me} fresh={fresh} dealIndex={((p.seat - viewer) % n + n) % n} />
            );
          })}
        </>
      )}
      {pick && pick.hint && <p className="table-hint" aria-live="polite">{pick.hint}</p>}
    </div>
  );
}

type Player = View["players"][number];

function Seat({ v, p, pos, L, legal, order, onPick, marks, bubble, awake, fresh, dealIndex }: {
  v: View; p: Player; pos: { x: number; y: number }; L: TableLayout; legal: boolean; order: number; onPick(): void; marks: Marker[];
  bubble?: { id: string; text: string }; awake: boolean; fresh: boolean; dealIndex: number;
}) {
  const game = v.game, mine = game?.mine ?? null, final = game?.final ?? null;
  const role: RoleId | null = final ? final.cards[p.seat] : game && mine?.seat === p.seat ? mine.dealt : null;
  const dead = !!final?.outcome.deaths.includes(p.seat), won = !!final?.outcome.winners.includes(p.seat);
  const voted = v.phase === "day" && !!game?.voted[p.seat];
  const myVote = v.phase === "day" && mine?.vote === p.seat;
  const chosen = order >= 0;
  const cls = ["seat", p.me && "is-me", legal && "is-legal", chosen && "is-chosen", dead && "is-dead", won && "is-winner", bubble && "is-speaking", awake && "is-awake", pos.y < L.cy - 4 && "is-top"].filter(Boolean).join(" ");
  const cardSize = Math.round(L.tw * (final ? 0.36 : 0.3));
  const style = { left: pos.x, top: pos.y, width: L.tw, ["--tw" as string]: `${L.tw}px`, ["--th" as string]: `${L.th}px`, ["--csz" as string]: `${cardSize}px`, ["--name-h" as string]: `${L.nameH}px`,
    ["--from-x" as string]: `${L.cx - pos.x}px`, ["--from-y" as string]: `${L.cy - pos.y}px`, ["--deal" as string]: `${dealIndex * 110}ms` } as CSSProperties;
  const label = `${p.name}${p.me ? " (you)" : ""}${p.bot ? ", practice bot" : ""}${voted ? ", has voted" : ""}${myVote ? ", your vote" : ""}${dead ? ", eliminated" : ""}${won ? ", won" : ""}${marks.length ? `. ${marks.map(m => m.title).join(" ")}` : ""}`;
  const finalTitle = final ? `${p.name} ended holding ${roleName(final.cards[p.seat])}${final.dealt[p.seat] !== final.cards[p.seat] ? ` (dealt ${roleName(final.dealt[p.seat])})` : ""}.` : undefined;
  const body = (
    <>
      <span className="seat-media">
        <Avatar name={p.name} bot={p.bot} />
        {game && (
          <span className={`seat-card${fresh ? " is-dealt" : ""}`} title={finalTitle ?? (role ? `You were dealt the ${ROLE[role].name}. Your card may have been moved since.` : "A face-down card")}>
            <Card role={role} size={cardSize} flipDelay={final ? 400 + dealIndex * 260 : fresh ? 900 + dealIndex * 110 : 0} />
            {final && final.dealt[p.seat] !== final.cards[p.seat] && <span className="seat-card-was" title={`Dealt ${roleName(final.dealt[p.seat])}`}><img src={`/art/${final.dealt[p.seat]}.webp`} alt="" /></span>}
          </span>
        )}
        {!!marks.length && (
          <span className="pins">
            {marks.slice(-3).map((m, k) => <Pin key={k} m={m} />)}
            {marks.length > 3 && <span className="pin pin-more" title={marks.slice(0, -3).map(m => m.title).join(" ")}>+{marks.length - 3}</span>}
          </span>
        )}
        {voted && <span className="seat-voted" title="Has voted (not for whom)"><IconCheck size={12} strokeWidth={2.6} /> voted</span>}
        {myVote && <span className="seat-myvote">Your vote</span>}
        {chosen && <span className="pick-badge">{order + 1}</span>}
        {dead && <span className="seat-stamp">Eliminated</span>}
        {final && <span className="seat-tally" title={`${final.outcome.tally[p.seat]} vote${final.outcome.tally[p.seat] === 1 ? "" : "s"}`}>{final.outcome.tally[p.seat]}</span>}
      </span>
      <span className="seat-bar">
        {p.host && <IconCrown size={13} className="seat-host" aria-label="host" />}
        <span className="seat-name">{p.name}</span>
        {p.me && <span className="seat-you">you</span>}
        {p.bot && <IconBot size={13} className="seat-bot" aria-label="bot" />}
        {won && <span className="seat-won">won</span>}
      </span>
      {final && <span className="seat-final">{roleName(final.cards[p.seat])}{final.dealt[p.seat] !== final.cards[p.seat] && <i> · was {roleName(final.dealt[p.seat])}</i>}</span>}
      {bubble && <span key={bubble.id} className="bubble" role="presentation">{bubble.text.length > 90 ? `${bubble.text.slice(0, 88)}…` : bubble.text}</span>}
    </>
  );
  return legal
    ? <button type="button" className={cls} style={style} onClick={onPick} aria-pressed={chosen} aria-label={`${chosen ? "Chosen: " : "Choose "}${label}`}>{body}</button>
    : <div className={cls} style={style} role="group" aria-label={label}>{body}</div>;
}

export function Pin({ m }: { m: Marker }) {
  return (
    <span className={`pin pin-${m.tone}${m.team ? ` team-${m.team}` : ""}`} title={m.title}>
      {m.role ? <img src={`/art/${m.role}.webp`} alt="" /> : m.tone === "shown" ? <IconEye size={11} /> : <span className="pin-dot" />}
      {m.tone === "shown" && m.role && <IconEye size={11} />}
      <span>{m.label}</span>
    </span>
  );
}

/** Short speech bubbles by a seat when that player posts in the chat. */
function useBubbles(v: View) {
  const seen = useRef<Set<string> | null>(null);
  const [bubbles, setBubbles] = useState<Record<number, { id: string; text: string }>>({});
  useEffect(() => {
    if (!seen.current) { seen.current = new Set(v.messages.map(m => m.id)); return; }
    for (const m of v.messages) {
      if (seen.current.has(m.id)) continue;
      seen.current.add(m.id);
      if (m.seat === null || m.seat === undefined) continue;
      const seat = m.seat;
      setBubbles(b => ({ ...b, [seat]: { id: m.id, text: m.text } }));
      setTimeout(() => setBubbles(b => (b[seat]?.id === m.id ? Object.fromEntries(Object.entries(b).filter(([k]) => +k !== seat)) : b)), 6500);
    }
  }, [v.messages]);
  return bubbles;
}

/** Who voted for whom, drawn across the table: your own vote during the day, everyone's at the end. */
function VoteArrows({ L, arrows, reveal }: { L: TableLayout; arrows: { from: number; to: number; mine: boolean; forced: boolean }[]; reveal: boolean }) {
  const mid = (i: number) => ({ x: L.seats[i].x, y: L.seats[i].y - L.nameH / 2 });
  return (
    <svg className={`arrows${reveal ? " is-reveal" : ""}`} aria-hidden>
      <defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10 3 5z" fill="context-stroke" /></marker>
      </defs>
      {arrows.map((a, k) => {
        const A = mid(a.from), B = mid(a.to);
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        // Bend toward the middle of the table, and to one side so A→B and B→A do not overlap.
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const C = { x: mx + (L.cx - mx) * 0.28 + nx * 26, y: my + (L.cy - my) * 0.28 + ny * 26 };
        const trim = (P: { x: number; y: number }) => { const ex = C.x - P.x, ey = C.y - P.y, el = Math.hypot(ex, ey) || 1, r = Math.min(L.tw, L.th) * 0.42; return { x: P.x + (ex / el) * r, y: P.y + (ey / el) * r }; };
        const S = trim(A), E = trim(B);
        return <path key={k} className={`arrow${a.mine ? " is-mine" : ""}${a.forced ? " is-forced" : ""}`} style={{ ["--k" as string]: k }} d={`M${S.x} ${S.y} Q${C.x} ${C.y} ${E.x} ${E.y}`} markerEnd="url(#arrowhead)" pathLength={1} />;
      })}
    </svg>
  );
}

