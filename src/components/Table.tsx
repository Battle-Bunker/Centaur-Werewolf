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
import { IconBot, IconCheck, IconCrown, IconHand, IconWifiOff } from "./icons";
import { myNight } from "../app/night";
import { heldInstances } from "./Result";
import { Presence, usePresence } from "./Setup";
import { Pin } from "./Pin";

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

  // During the vote the table itself is the ballot.
  const ballot: Picker | null = v.phase === "vote" && mine ? {
    legal: v.players.filter(p => p.seat !== mine.seat).map(p => ({ k: "p" as const, i: p.seat })),
    chosen: mine.vote !== null ? [{ k: "p", i: mine.vote }] : [],
    hint: "",
    done: mine.vote !== null,
    onPick: s => { if (s.i !== mine.vote) void exec("day.vote", { seat: s.i }).catch(() => {}); },
  } : null;
  const pick = v.phase === "night" ? picker : ballot;
  const legal = (s: Slot) => !!pick?.legal.some(l => sameSlot(l, s));
  const order = (s: Slot) => pick ? pick.chosen.findIndex(l => sameSlot(l, s)) : -1;

  const bubbles = useBubbles(v);
  const awake = !!myNight(v)?.awake;
  // The deal: cards fly from the middle to each seat when a round has just begun.
  // Your turn: say so, even if the panel is hidden or showing the chat.
  const { toast, setTab } = useApp();
  const wasAwake = useRef(false);
  useEffect(() => {
    if (awake && !wasAwake.current && (v.context.openSteps.length || v.context.adoptOpen.length)) { toast("You are awake. Decide now, or it is chosen at random.", "ok"); setTab("mine"); }
    wasAwake.current = awake;
  }, [awake]); // eslint-disable-line react-hooks/exhaustive-deps

  // While the phase curtain is up (the phase changed with this page open), the deal and the reveal wait for it.
  const changed = useRef<{ key: string; at: number; live: boolean } | null>(null);
  const phaseKey = `${v.round}:${v.phase}`;
  if (changed.current?.key !== phaseKey) changed.current = { key: phaseKey, at: Date.now(), live: !!changed.current };
  const lead = changed.current.live ? 1500 : 0;
  const fresh = v.phase === "night" && !!game && game.turn === 0 && (changed.current.live ? Date.now() - changed.current.at < 6000 : Date.now() - game.turns[0].startsAt < 2500);

  const arrows = useMemo(() => {
    if (!L) return [];
    if (final) return final.votes.flatMap((t, i) => (t === null ? [] : [{ from: i, to: t, mine: i === mine?.seat, forced: final.forcedVotes.includes(i) }]));
    if (v.phase === "vote" && mine && mine.vote !== null) return [{ from: mine.seat, to: mine.vote, mine: true, forced: false }];
    return [];
  }, [L, final, v.phase, mine]);

  return (
    <div className={`table${awake ? " is-awake" : ""}${pick ? (pick.done ? " is-settled" : " is-picking") : ""}`} ref={box} aria-label="The table" style={{ ["--lead" as string]: `${lead}ms` }}>
      {L && (
        <>
          <div className="felt" style={{ left: L.cx, top: L.cy, width: Math.max(160, (size.w - L.tw * 0.9)), height: Math.max(120, (size.h - L.th * 0.9)) }} aria-hidden />
          <div className="centre" style={{ left: L.cx - L.cw / 2, top: L.cy - L.ch / 2, width: L.cw, height: L.ch }}>
            <CentreStage w={L.cw} h={L.ch} pick={pick} legal={legal} order={order} markers={markers} fresh={fresh} lead={lead} />
          </div>
          {arrows.length > 0 && <VoteArrows L={L} arrows={arrows} reveal={!!final} />}
          {v.players.map((p, idx) => {
            const s: Slot = { k: "p", i: p.seat };
            const pos = L.seats[p.seat] ?? L.seats[idx];
            return (
              <Seat key={p.id} v={v} p={p} pos={pos} L={L} legal={legal(s)} order={order(s)} onPick={() => pick?.onPick(s)} marks={markers[slotKey(s)] ?? []}
                bubble={bubbles[p.seat]} awake={awake && p.me} fresh={fresh} lead={lead} dealIndex={((p.seat - viewer) % n + n) % n} ordered={!!pick?.ordered} />
            );
          })}
        </>
      )}
    </div>
  );
}

type Player = View["players"][number];

function Seat({ v, p, pos, L, legal, order, onPick, marks, bubble, awake, fresh, lead, dealIndex, ordered }: {
  v: View; p: Player; pos: { x: number; y: number }; L: TableLayout; legal: boolean; order: number; onPick(): void; marks: Marker[];
  bubble?: { id: string; text: string }; awake: boolean; fresh: boolean; lead: number; dealIndex: number; ordered: boolean;
}) {
  const game = v.game, mine = game?.mine ?? null, final = game?.final ?? null;
  const role: RoleId | null = final ? final.cards[p.seat] : game && mine?.seat === p.seat ? mine.dealt : null;
  const randomVote = !!final?.forcedVotes.includes(p.seat);
  const plays = final ? (final.adopted[String(heldInstances(final)[p.seat])] ?? null) : null;
  const dead = !!final?.outcome.deaths.includes(p.seat), won = !!final?.outcome.winners.includes(p.seat);
  const voted = v.phase === "vote" && !!game?.voted[p.seat];
  const ready = v.phase === "day" && !!game?.ready?.[p.seat];
  const myVote = v.phase === "vote" && mine?.vote === p.seat;
  const presence = usePresence(p);
  const offline = presence === "offline" && !final;
  // A play-test table's host sees the deal.
  const dealtHere = game?.playtestDeal && !final && !(mine?.seat === p.seat) ? game.playtestDeal.dealt[p.seat] : null;
  const chosen = order >= 0;
  const cls = ["seat", p.me && "is-me", legal && "is-legal", chosen && "is-chosen", dead && "is-dead", won && "is-winner", bubble && "is-speaking", awake && "is-awake", offline && "is-offline", ready && "is-ready", pos.y < L.cy - 4 && "is-top", L.tw < 120 && "is-small"].filter(Boolean).join(" ");
  const cardSize = Math.round(L.tw * (final ? 0.36 : 0.3));
  const style = { left: pos.x, top: pos.y, width: L.tw, ["--tw" as string]: `${L.tw}px`, ["--th" as string]: `${L.th}px`, ["--csz" as string]: `${cardSize}px`, ["--name-h" as string]: `${L.nameH}px`,
    ["--from-x" as string]: `${L.cx - pos.x}px`, ["--from-y" as string]: `${L.cy - pos.y}px`, ["--deal" as string]: `${dealIndex * 110}ms` } as CSSProperties;
  const label = `${p.name}${p.me ? " (you)" : ""}${p.bot ? ", practice bot" : ""}${offline ? ", offline" : ""}${ready ? ", ready to vote" : ""}${voted ? ", has voted" : ""}${randomVote ? ", did not vote in time (voted at random)" : ""}${myVote ? ", your vote" : ""}${dead ? ", eliminated" : ""}${won ? ", won" : ""}${marks.length ? `. ${marks.map(m => m.title).join(" ")}` : ""}`;
  const finalTitle = final ? `${p.name} ended holding ${roleName(final.cards[p.seat])}${final.dealt[p.seat] !== final.cards[p.seat] ? ` (dealt ${roleName(final.dealt[p.seat])})` : ""}.` : undefined;
  const body = (
    <>
      <span className="seat-media">
        <Avatar name={p.name} bot={p.bot} />
        {game && (
          <span className={`seat-card${fresh ? " is-dealt" : ""}`} title={finalTitle ?? (role ? `You were dealt the ${ROLE[role].name}. Your card may have been moved since.` : "A face-down card")}>
            <Card role={role} size={cardSize} reveal={fresh} flipDelay={final ? lead + 400 + dealIndex * 260 : fresh ? lead + 900 + dealIndex * 110 : 0} />
            {final && final.dealt[p.seat] !== final.cards[p.seat] && <span className="seat-card-was" title={`Dealt ${roleName(final.dealt[p.seat])}`}><img src={`/art/${final.dealt[p.seat]}.webp`} alt="" /></span>}
          </span>
        )}
        {!!marks.length && (
          <span className="pins">
            {marks.slice(-3).map((m, k) => <Pin key={k} m={m} />)}
            {marks.length > 3 && <span className="pin pin-more" title={marks.slice(0, -3).map(m => m.title).join(" ")}>+{marks.length - 3}</span>}
          </span>
        )}
        {offline && <span className="seat-offline" title="No word from this player for a while: their connection may have dropped."><IconWifiOff size={16} /><span>Offline</span></span>}
        {voted && <span className="seat-voted" title="Has voted (not for whom)"><IconCheck size={12} strokeWidth={2.6} /> voted</span>}
        {ready && <span className="seat-voted seat-ready" title="Ready to vote"><IconHand size={12} strokeWidth={2.2} /> ready</span>}
        {randomVote && <span className="seat-random" title="Did not vote in time: the game voted at random for them.">{L.tw < 120 ? "random" : "random vote"}</span>}
        {dealtHere && <span className="seat-dealt" title={`Play-test: dealt ${roleName(dealtHere)}`}><img src={`/art/${dealtHere}.webp`} alt="" />{roleName(dealtHere)}</span>}
        {myVote && <span className="seat-myvote">Your vote</span>}
        {chosen && <span className="pick-badge">{ordered ? order + 1 : <IconCheck size={14} strokeWidth={3} />}</span>}
        {dead && <span className="seat-stamp">Eliminated</span>}
        {bubble && <span key={bubble.id} className={`caption${marks.length ? " is-up" : ""}`} role="presentation">{bubble.text.length > 120 ? `${bubble.text.slice(0, 118)}…` : bubble.text}</span>}
        {final && final.outcome.tally[p.seat] > 0 && <span className="seat-tally" title={`${final.outcome.tally[p.seat]} vote${final.outcome.tally[p.seat] === 1 ? "" : "s"}`}>{final.outcome.tally[p.seat]}</span>}
      </span>
      <span className="seat-bar">
        {p.host && <IconCrown size={13} className="seat-host" aria-label="host" />}
        <span className="seat-name">{p.name}</span>
        {p.me && <span className="seat-you">you</span>}
        {p.bot ? <IconBot size={13} className="seat-bot" aria-label="bot" /> : !p.me && !final && <Presence p={p} compact />}
        {won && <span className="seat-won">won</span>}
      </span>
      {final && <span className="seat-final">{roleName(final.cards[p.seat])}{plays && plays !== final.cards[p.seat] && <i> (copy of {roleName(plays)})</i>}{final.dealt[p.seat] !== final.cards[p.seat] && <i> · was {roleName(final.dealt[p.seat])}</i>}</span>}
    </>
  );
  return legal
    ? <button type="button" className={cls} style={style} onClick={onPick} aria-pressed={chosen} aria-label={`${chosen ? "Chosen: " : "Choose "}${label}`}>{body}</button>
    : <div className={cls} style={style} role="group" aria-label={label}>{body}</div>;
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
      // A sealed message is signed by a role, not a player: no bubble on anyone's seat.
      if (m.seat === null || m.seat === undefined || m.seal) continue;
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

