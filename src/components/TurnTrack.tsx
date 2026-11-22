/**
 * The night's timetable, the same for everyone: every turn in wake order, which one is happening now. Each turn lasts
 * exactly as long as the others whether or not anyone holds that role, so the clock gives nothing away. In the lobby
 * it previews the order the deck will wake in.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { nightTurns } from "../../shared/engine";
import { ROLE } from "../../shared/roles";
import { myNight } from "../app/night";
import { useApp, useNow } from "../app/store";
import { rolesInTurn } from "../app/teams";
import { IconMoon } from "./icons";

export function TurnTrack() {
  const { view } = useApp();
  const now = useNow(250);
  const list = useRef<HTMLOListElement>(null);
  const game = view?.game;
  useEffect(() => {
    const ol = list.current, el = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (ol && el) ol.scrollTo({ left: el.offsetLeft - ol.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [game?.turn]);
  if (!view) return null;
  if (view.phase === "lobby") {
    const order = nightTurns(view.settings.deck);
    if (!order.length) return null;
    return (
      <div className="track track-preview" aria-label="The order the night will run in">
        <span className="track-label">Night order</span>
        <ol className="track-turns" ref={list}>
          <li className="turn is-next"><span className="turn-glyph"><IconMoon size={14} /></span><span className="turn-name">Dusk</span></li>
          {order.map(r => <TurnFace key={r} role={r} deck={view.settings.deck} className="turn is-next" />)}
        </ol>
      </div>
    );
  }
  if (view.phase !== "night" || !game) return null;
  const n = myNight(view);
  return (
    <div className="track" aria-label="Night turns">
      <ol className="track-turns" ref={list}>
        {game.turns.map((t, i) => {
          const state = i < game.turn ? "done" : i === game.turn ? "now" : "next";
          const mine = !!n && i > 0 && (i === n.ownTurn || i === n.copyTurn);
          const frac = state === "now" ? Math.min(1, Math.max(0, (now - t.startsAt) / (t.endsAt - t.startsAt))) : state === "done" ? 1 : 0;
          if (!t.role) return (
            <li key={i} className={`turn is-${state}`} aria-current={state === "now" ? "step" : undefined} title="Dusk: everyone reads their card and may queue their move.">
              <span className="turn-glyph"><IconMoon size={14} /></span><span className="turn-name">Dusk</span>
              <span className="turn-fill" style={{ transform: `scaleX(${frac})` }} aria-hidden />
            </li>
          );
          return (
            <TurnFace key={i} role={t.role} deck={view.settings.deck} className={`turn is-${state}${mine ? " is-mine" : ""}`} current={state === "now"}>
              {mine && <span className="turn-you">{i === n?.copyTurn ? "your copy" : "you"}</span>}
              <span className="turn-fill" style={{ transform: `scaleX(${frac})` }} aria-hidden />
            </TurnFace>
          );
        })}
      </ol>
    </div>
  );
}

/** One public turn: its role, and any other cards of the deck that act in it (shadow twins, the shared Kindler turn). */
function TurnFace({ role, deck, className, current, children }: { role: string; deck: string[]; className: string; current?: boolean; children?: ReactNode }) {
  const kin = rolesInTurn(role, deck).filter(r => r !== role);
  const all = [role, ...kin];
  return (
    <li className={`${className}${kin.length ? " is-shared" : ""}`} aria-current={current ? "step" : undefined}
      title={all.map(r => `${ROLE[r]?.name ?? r}: ${ROLE[r]?.blurb ?? ""}`).join("\n") + (kin.length ? "\nOne public turn for all of these." : "")}>
      <span className="turn-arts">{all.slice(0, 3).map(r => <img key={r} src={`/art/${r}.webp`} alt="" />)}</span>
      <span className="turn-name">{ROLE[role]?.name ?? role}{kin.length > 0 && <i className="turn-kin"> +{kin.length}</i>}</span>
      {children}
    </li>
  );
}
