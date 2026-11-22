/**
 * The night's timetable, the same for everyone: every turn in wake order, which one is happening now and how long is
 * left. Each turn lasts exactly as long as the others whether or not anyone holds that role, so the clock gives
 * nothing away. During the day it shows the discussion timer instead.
 */
import { ROLE } from "../../shared/roles";
import { useApp, useNow } from "../app/store";
import { Countdown, CommandButton, RoleArt } from "./bits";

export function TurnTrack() {
  const { view } = useApp();
  const now = useNow();
  const game = view?.game;
  if (!view || !game) return <div className="track track-lobby"><span className="eyebrow">Lobby</span><span>{view?.players.length ?? 0} at the table. The deck needs {(view?.players.length ?? 0) + 3} cards.</span></div>;
  if (view.phase === "night") {
    const turn = game.turns[game.turn];
    return (
      <div className="track" aria-label="Night turns">
        <ol className="track-turns">
          {game.turns.map((t, i) => {
            const state = i < game.turn ? "done" : i === game.turn ? "now" : "next";
            const mine = game.mine && t.role === game.mine.dealt;
            return (
              <li key={i} className={`turn is-${state}${mine ? " is-mine" : ""}`} aria-current={state === "now" ? "step" : undefined} title={t.role ? ROLE[t.role].blurb : "Everyone reads their card and may queue their move."}>
                {t.role ? <RoleArt role={t.role} size={28} label="" /> : <span className="turn-dusk" aria-hidden>☾</span>}
                <span className="turn-name">{t.role ? ROLE[t.role].name : "Dusk"}</span>
                {mine && <span className="turn-you">you</span>}
                {state === "now" && <span className="turn-fill" style={{ width: `${Math.min(100, Math.max(0, (now - t.startsAt) / (t.endsAt - t.startsAt)) * 100)}%` }} />}
              </li>
            );
          })}
        </ol>
        {turn && <Countdown from={turn.startsAt} until={turn.endsAt} label="Time left in this turn" />}
      </div>
    );
  }
  if (view.phase === "day") {
    const voted = game.voted.filter(Boolean).length;
    return (
      <div className="track track-day">
        <span className="eyebrow">Day</span>
        <span>Talk it over, then vote. {voted} of {game.voted.length} have voted.</span>
        <span className="top-space" />
        <CommandButton id="day.endDiscussion" variant="quiet" />
        {game.dayEndsAt && <Countdown from={game.dayEndsAt - view.settings.daySeconds * 1000} until={game.dayEndsAt} label="Time left to vote" />}
      </div>
    );
  }
  return <div className="track track-day"><span className="eyebrow">Game over</span><span>{game.final?.outcome.headline}</span><span className="top-space" /><CommandButton id="game.playAgain" variant="primary" /></div>;
}
