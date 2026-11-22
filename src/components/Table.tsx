/**
 * The table: every player on an ellipse in their seat order, you at the bottom, the three centre cards in the middle.
 * It takes most of the screen on purpose. Each seat's `.seat-media` box is a 4:3 tile that holds an avatar today and
 * will hold that player's video stream later; hovering a seat already enlarges it the way an active speaker will.
 *
 * Seats and centre cards become clickable when something is being chosen (a night target, a vote): the side panel or
 * the day phase publishes a `picker`, and the table only shows it.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CENTER_CARDS, ROLE, roleName, sameSlot, slotKey, TEAM_NAME, type Slot } from "../../shared/roles";
import { useApp, type Picker } from "../app/store";
import { RoleArt } from "./bits";

export function Table() {
  const { view, picker, exec } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
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

  // What you learned at night, pinned to the seat or centre card it is about.
  const notes = useMemo(() => {
    const out: Record<string, string[]> = {};
    const add = (s: Slot, text: string) => { (out[slotKey(s)] ??= []).push(text); };
    for (const e of mine?.journal ?? []) {
      if (e.ev.kind === "look") e.ev.slots.forEach((s, i) => add(s, e.ev.kind === "look" && e.ev.roles ? `saw ${roleName(e.ev.roles[i])}` : `${TEAM_NAME[(e.ev as { teams: ("village" | "werewolf" | "lone")[] }).teams[i]]}`));
      if (e.ev.kind === "seats") e.ev.seats.forEach(i => add({ k: "p", i }, "Werewolf"));
      if (e.ev.kind === "swap") { add(e.ev.a, "swapped"); add(e.ev.b, "swapped"); }
      if (e.ev.kind === "moved") e.ev.slots.forEach((s, i) => add(s, e.ev.kind === "moved" && e.ev.moved[i] ? "moved" : "not moved"));
    }
    return out;
  }, [mine?.journal]);

  // During the day the table itself is the ballot.
  const ballot: Picker | null = v.phase === "day" && mine ? {
    legal: v.players.filter(p => p.seat !== mine.seat).map(p => ({ k: "p" as const, i: p.seat })),
    chosen: mine.vote !== null ? [{ k: "p", i: mine.vote }] : [],
    hint: mine.vote === null ? "Click a player to vote for them." : `You voted for ${v.players[mine.vote]?.name}. Click another player to change it.`,
    onPick: s => void exec("day.vote", { seat: s.i }).catch(() => {}),
  } : null;
  const pick = v.phase === "night" ? picker : ballot;
  const legal = (s: Slot) => !!pick?.legal.some(l => sameSlot(l, s));
  const chosen = (s: Slot) => !!pick?.chosen.some(l => sameSlot(l, s));

  const tileW = Math.round(Math.max(84, Math.min(230, (size.w * 0.9) / (Math.ceil(n / 2) + 1), size.h * 0.26 * (4 / 3))));
  const tileH = Math.round(tileW * 0.75);
  const rx = Math.max(40, size.w / 2 - tileW / 2 - 14), ry = Math.max(40, size.h / 2 - tileH / 2 - (final ? 46 : 26));
  const cardSize = Math.round(Math.max(34, Math.min(tileW * 0.5, 96, size.h * 0.15, size.w * 0.085)));

  return (
    <div className="table" ref={box} style={{ ["--tile-w" as string]: `${tileW}px`, ["--tile-h" as string]: `${tileH}px`, ["--card" as string]: `${cardSize}px` }}>
      <div className="felt" style={{ width: rx * 1.5, height: ry * 1.5 }} aria-hidden />

      <div className="centre">
        {game ? (
          <>
            <div className="centre-cards">
              {Array.from({ length: CENTER_CARDS }, (_, i) => {
                const s: Slot = { k: "c", i };
                const role = final ? final.center[i] : null;
                const inner = (
                  <>
                    <RoleArt role={role} label={role ? ROLE[role].name : `Centre card ${i + 1}`} />
                    <span className="card-caption">{role ? ROLE[role].name : `Centre ${i + 1}`}</span>
                    <span className="card-notes">{notes[slotKey(s)]?.map((t, k) => <span key={k} className="note">{t}</span>)}</span>
                  </>
                );
                return legal(s)
                  ? <button key={i} type="button" className={`card is-legal${chosen(s) ? " is-chosen" : ""}`} onClick={() => pick!.onPick(s)}>{inner}</button>
                  : <div key={i} className={`card${chosen(s) ? " is-chosen" : ""}`}>{inner}</div>;
              })}
            </div>
            {pick && size.h > 430 && <p className="centre-hint">{pick.hint}</p>}
          </>
        ) : (
          <div className="centre-lobby"><RoleArt role={null} size={cardSize * 1.4} label="" /><p>Waiting to deal</p></div>
        )}
      </div>

      {v.players.map(p => {
        const angle = Math.PI / 2 + ((p.seat - viewer) * 2 * Math.PI) / n;
        const s: Slot = { k: "p", i: p.seat };
        const role = final ? final.cards[p.seat] : game && mine?.seat === p.seat ? mine.dealt : null;
        const dead = !!final?.outcome.deaths.includes(p.seat), won = !!final?.outcome.winners.includes(p.seat);
        const cls = ["seat", p.me && "is-me", legal(s) && "is-legal", chosen(s) && "is-chosen", dead && "is-dead", won && "is-winner"].filter(Boolean).join(" ");
        const body = (
          <>
            <div className="seat-media">
              <span className="avatar" aria-hidden>{p.bot ? "⚙" : p.name.slice(0, 1).toUpperCase()}</span>
              {game && (
                <span className="seat-card" title={final ? `Ended the night as ${ROLE[role!].name}` : role ? `You were dealt ${ROLE[role].name}. Your card may have changed since.` : "Face down"}>
                  <RoleArt role={role} />
                </span>
              )}
              <span className="seat-notes">{notes[slotKey(s)]?.map((t, k) => <span key={k} className="note">{t}</span>)}</span>
              {dead && <span className="seat-stamp">Eliminated</span>}
            </div>
            <div className="seat-bar">
              <span className="seat-name">{p.name}{p.me ? " (you)" : ""}</span>
              {p.host && <span className="tag">host</span>}
              {p.bot && <span className="tag">bot</span>}
              {v.phase === "day" && game?.voted[p.seat] && <span className="tag tag-ok">voted</span>}
              {won && <span className="tag tag-win">won</span>}
            </div>
            {final && (
              <div className="seat-final">
                <b>{ROLE[final.cards[p.seat]].name}</b>
                {final.dealt[p.seat] !== final.cards[p.seat] && <span> · dealt {ROLE[final.dealt[p.seat]].name}</span>}
                <span> · voted {v.players[final.votes[p.seat]!]?.name}{final.forcedVotes.includes(p.seat) ? " (random)" : ""}</span>
              </div>
            )}
          </>
        );
        const style = { left: size.w / 2 + rx * Math.cos(angle), top: size.h / 2 + ry * Math.sin(angle) };
        return legal(s)
          ? <button key={p.id} type="button" className={cls} style={style} onClick={() => pick!.onPick(s)} aria-pressed={chosen(s)}>{body}</button>
          : <div key={p.id} className={cls} style={style}>{body}</div>;
      })}
    </div>
  );
}
