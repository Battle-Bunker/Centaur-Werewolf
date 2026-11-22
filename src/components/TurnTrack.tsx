/**
 * The night's timetable, the same for everyone: every turn in wake order, which one is happening now. Each turn lasts
 * exactly as long as the others whether or not anyone holds that role, so the clock gives nothing away. In the lobby
 * it previews the order the deck will wake in.
 */
import { useEffect, useRef } from "react";
import { nightTurns } from "../../shared/engine";
import { ROLE } from "../../shared/roles";
import { useApp, useNow } from "../app/store";
import { IconMoon } from "./icons";

export function TurnTrack() {
  const { view } = useApp();
  const now = useNow(250);
  const list = useRef<HTMLOListElement>(null);
  const game = view?.game;
  useEffect(() => { list.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }, [game?.turn]);
  if (!view) return null;
  if (view.phase === "lobby") {
    const order = nightTurns(view.settings.deck);
    if (!order.length) return null;
    return (
      <div className="track track-preview" aria-label="The order the night will run in">
        <span className="track-label">Night order</span>
        <ol className="track-turns" ref={list}>
          <li className="turn is-next"><span className="turn-glyph"><IconMoon size={14} /></span><span className="turn-name">Dusk</span></li>
          {order.map(r => <li key={r} className="turn is-next" title={ROLE[r].blurb}><img src={`/art/${r}.webp`} alt="" /><span className="turn-name">{ROLE[r].name}</span></li>)}
        </ol>
      </div>
    );
  }
  if (view.phase !== "night" || !game) return null;
  return (
    <div className="track" aria-label="Night turns">
      <ol className="track-turns" ref={list}>
        {game.turns.map((t, i) => {
          const state = i < game.turn ? "done" : i === game.turn ? "now" : "next";
          const mine = !!game.mine && t.role === game.mine.dealt;
          const frac = state === "now" ? Math.min(1, Math.max(0, (now - t.startsAt) / (t.endsAt - t.startsAt))) : state === "done" ? 1 : 0;
          return (
            <li key={i} className={`turn is-${state}${mine ? " is-mine" : ""}`} aria-current={state === "now" ? "step" : undefined}
              title={t.role ? `${ROLE[t.role].name}: ${ROLE[t.role].blurb}` : "Dusk: everyone reads their card and may queue their move."}>
              {t.role ? <img src={`/art/${t.role}.webp`} alt="" /> : <span className="turn-glyph"><IconMoon size={14} /></span>}
              <span className="turn-name">{t.role ? ROLE[t.role].name : "Dusk"}</span>
              {mine && <span className="turn-you">you</span>}
              <span className="turn-fill" style={{ transform: `scaleX(${frac})` }} aria-hidden />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
