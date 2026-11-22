/**
 * The middle of the table: what is happening now (the lobby's deck, the night turn with its art and clock, the day's
 * vote, the verdict) above the face-down centre cards.
 */
import { useMemo } from "react";
import { deckProblem } from "../../shared/engine";
import { ROLE, roleName, slotKey, type RoleId, type Slot } from "../../shared/roles";
import type { Marker } from "../app/knowledge";
import { useApp, useNow, type Picker } from "../app/store";
import { Card, CommandButton, CountdownRing, ordinal } from "./bits";
import { IconCheck, IconEye, IconMoon, IconSun } from "./icons";
import { Pin } from "./Table";

interface Props { w: number; h: number; pick: Picker | null; legal(s: Slot): boolean; order(s: Slot): number; markers: Record<string, Marker[]>; fresh: boolean; lead: number }

export function CentreStage({ w, h, pick, legal, order, markers, fresh, lead }: Props) {
  const { view } = useApp();
  const v = view!;
  const game = v.game, final = game?.final ?? null;
  const count = final ? final.center.length : v.settings.centerCount;
  const compact = h < 230 || w < 280;
  const hintH = pick?.hint ? (compact ? 16 : 30) : 0;
  const pinRows = final || compact ? 0 : (Array.from({ length: count }, (_, i) => (markers[`c${i}`] ?? []).some(m => m.tone !== "shown")).some(Boolean) ? 1 : 0);
  const capH = compact ? 0 : 20;
  // The stage gets what it can after the cards have a decent size (60px), between a compact strip and 150px.
  const perRow1 = count, perRow2 = Math.ceil(count / 2);
  const rowsWanted = count > 3 && (w - (perRow1 - 1) * 8) / perRow1 < 58 ? 2 : 1;
  const needCards = rowsWanted * (60 + capH + 6) + pinRows * 22 + hintH + (compact ? 6 : 18);
  const stageH = Math.round(Math.max(compact ? 48 : 64, Math.min(compact ? 64 : 150, h * (final ? 0.42 : 0.4), h - needCards)));
  const room = h - stageH - hintH - pinRows * 22 - (compact ? 6 : 18);
  const oneRow = Math.min((w - (perRow1 - 1) * 8) / perRow1, room - capH - 6);
  const twoRow = Math.min((w - (perRow2 - 1) * 8) / perRow2, (room - 14) / 2 - capH - 6);
  const rows = count > 3 && twoRow > oneRow * 1.15 ? 2 : 1;
  const cardSize = Math.max(28, Math.floor(Math.min(final ? 104 : 96, rows === 1 ? oneRow : twoRow)));

  if (!game) return <LobbyCentre w={w} h={h} />;
  return (
    <div className={`stage-col${compact ? " is-compact" : ""}`} style={{ ["--stage-h" as string]: `${stageH}px` }}>
      <div className="stage-now" style={{ height: stageH }}>
        {final ? <Verdict compact={compact} /> : v.phase === "day" ? <DayNow size={stageH} compact={compact} /> : <NightNow size={stageH} compact={compact} />}
      </div>
      <div className={`centre-cards rows-${rows}`} style={{ ["--csz" as string]: `${cardSize}px`, ["--per-row" as string]: rows === 2 ? Math.ceil(count / 2) : count }}>
        {Array.from({ length: count }, (_, i) => {
          const s: Slot = { k: "c", i };
          const role: RoleId | null = final ? final.center[i] : null;
          const marks = markers[slotKey(s)] ?? [];
          const own = marks.filter(m => m.tone !== "shown");
          const shown = game.shown.filter(x => x.slot.k === "c" && x.slot.i === i);
          const o = order(s);
          const inner = (
            <>
              <span className={`centre-card-face${fresh ? " is-dealt" : ""}`} style={{ ["--deal" as string]: `${i * 70}ms` }}>
                <Card role={role} size={cardSize} label={role ? `Centre ${i + 1}: ${ROLE[role].name}` : `Centre card ${i + 1}, face down`} flipDelay={final ? lead + 200 + i * 180 : 0} />
                {!final && shown.length > 0 && <span className="shown-ghost" title={`Shown to everyone as ${roleName(shown[shown.length - 1].role)} during the Herald's turn. It may have moved since.`}><img src={`/art/${shown[shown.length - 1].role}.webp`} alt="" /></span>}
                {o >= 0 && <span className="pick-badge">{pick?.ordered ? o + 1 : <IconCheck size={14} strokeWidth={3} />}</span>}
              </span>
              {!compact && cardSize >= 50 && (!final && shown.length
                ? <span className="card-caption is-shown" title={`Shown to everyone as ${roleName(shown[shown.length - 1].role)} during the Herald's turn. It may have moved since.`}><IconEye size={12} /> was {roleName(shown[shown.length - 1].role)}</span>
                : <span className="card-caption">{role ? ROLE[role].name : `Centre ${i + 1}`}</span>)}
              {!final && !compact && own.length > 0 && <span className="pins pins-centre">{own.slice(-1).map((m, k) => <Pin key={k} m={{ ...m, title: own.map(x => x.title).join(" ") }} />)}</span>}
            </>
          );
          const label = `Centre card ${i + 1}${marks.length ? `. ${marks.map(m => m.title).join(" ")}` : ""}`;
          return legal(s)
            ? <button key={i} type="button" className={`centre-card is-legal${o >= 0 ? " is-chosen" : ""}`} onClick={() => pick!.onPick(s)} aria-pressed={o >= 0} aria-label={`${o >= 0 ? "Chosen: " : "Choose "}${label}`}>{inner}</button>
            : <div key={i} className={`centre-card${o >= 0 ? " is-chosen" : ""}`} role="group" aria-label={label}>{inner}</div>;
        })}
      </div>
      {pick?.hint && <p className={`stage-hint${compact ? " is-compact" : ""}`} aria-live="polite">{pick.hint}</p>}
    </div>
  );
}

function NightNow({ size, compact }: { size: number; compact: boolean }) {
  const { view } = useApp();
  const now = useNow(500);
  const game = view!.game!, mine = game.mine;
  const turn = game.turns[game.turn];
  const ring = compact ? Math.max(44, Math.min(size - 6, 64)) : Math.max(56, Math.min(size - 8, 128));
  if (!turn) return <div className="now"><div className="now-text"><h3>Dawn is coming</h3></div></div>;
  const myIndex = mine ? game.turns.findIndex(t => t.role === mine.dealt) : -1;
  const isMine = turn.role !== null && turn.role === mine?.dealt;
  const ahead = myIndex > game.turn ? myIndex - game.turn : 0;
  const nightTurns = game.turns.length - 1;
  const title = turn.role ? <>The <em>{ROLE[turn.role].name}</em> wakes</> : <>Dusk</>;
  const sub = !mine ? "You are watching this round."
    : turn.role === null ? (myIndex > 0 ? `Read your card. You wake ${ordinal(myIndex)} of ${nightTurns}: queue your move now.` : "Read your card. You sleep through the night.")
    : isMine ? (mine.progress.done ? "Your move has played." : "Your turn. Decide now.")
    : ahead ? `Your turn ${ahead === 1 ? "is next" : `comes in ${ahead} turns`}, at about ${Math.max(0, Math.ceil((game.turns[myIndex].startsAt - now) / 1000))}s.`
    : "Every role in the deck takes a turn, held or not.";
  return (
    <div key={game.turn} className={`now now-night${isMine ? " is-mine" : ""}${compact ? " is-compact" : ""}`}>
      <CountdownRing from={turn.startsAt} until={turn.endsAt} size={ring} label="Time left in this turn">
        {turn.role ? <img src={`/art/${turn.role}.webp`} alt="" className="now-art" /> : <IconMoon size={ring * 0.42} strokeWidth={1.3} />}
      </CountdownRing>
      <div className="now-text">
        <span className="eyebrow">{turn.role ? `Turn ${game.turn} of ${nightTurns}` : "Night begins"} · <span className="mono">{Math.max(0, Math.ceil((turn.endsAt - now) / 1000))}s</span></span>
        <h3>{title}</h3>
        {!compact && <p>{sub}</p>}
      </div>
    </div>
  );
}

function DayNow({ size, compact }: { size: number; compact: boolean }) {
  const { view } = useApp();
  const now = useNow(500);
  const game = view!.game!, mine = game.mine;
  const voted = game.voted.filter(Boolean).length;
  const ring = compact ? Math.max(44, Math.min(size - 6, 64)) : Math.max(56, Math.min(size - 8, 116));
  const ends = game.dayEndsAt ?? now;
  const left = Math.max(0, Math.ceil((ends - now) / 1000));
  return (
    <div className={`now now-day${compact ? " is-compact" : ""}`}>
      <CountdownRing from={ends - view!.settings.daySeconds * 1000} until={ends} size={ring} label="Time left to talk and vote">
        <IconSun size={ring * 0.42} strokeWidth={1.3} />
      </CountdownRing>
      <div className="now-text">
        <span className="eyebrow">Day · <span className="mono">{left >= 60 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : `${left}s`}</span> left</span>
        <h3>{voted} of {game.voted.length} have voted</h3>
        {!compact && <p>{!mine ? "You are watching this round." : mine.vote === null ? "Talk it over, then click a player to vote." : "You can change your vote until the day ends."}</p>}
      </div>
    </div>
  );
}

function Verdict({ compact }: { compact: boolean }) {
  const { view } = useApp();
  const v = view!, final = v.game!.final!, mine = v.game!.mine;
  const o = final.outcome;
  const won = mine ? o.winners.includes(mine.seat) : null;
  const team = o.winningTeam;
  const title = verdictTitle(team, o.winners.length ? roleName(final.cards[o.winners[0]]) : "");
  return (
    <div className={`now now-verdict verdict-${team}${compact ? " is-compact" : ""}`}>
      <div className="now-text">
        {won !== null && <span className={`verdict-you ${won ? "is-won" : "is-lost"}`}>{won ? "You won" : "You lost"}</span>}
        <h3>{title}</h3>
        {!compact && <p>{o.headline}</p>}
        {!compact && o.notes.map((n, i) => <p key={i} className="verdict-note">{n}</p>)}
      </div>
    </div>
  );
}

export const verdictTitle = (team: string, loneName: string) =>
  team === "nobody" ? "Nobody wins" : team === "lone" ? `The ${loneName} wins alone` : team === "werewolf" ? "The Werewolves win" : "The Centaurs win";

function LobbyCentre({ w, h }: { w: number; h: number }) {
  const { view, ctx } = useApp();
  const v = view!;
  const need = v.players.length + v.settings.centerCount;
  const problem = deckProblem(v.settings.deck, v.players.length, v.settings.centerCount);
  const fan = useMemo(() => v.settings.deck.slice(0, 10), [v.settings.deck]);
  const small = h < 230 || w < 280;
  const c = Math.max(30, Math.min(84, h * (small ? 0.36 : 0.3), (w * 0.9) / Math.max(4, fan.length * 0.55)));
  const spread = Math.min(0.42, fan.length > 1 ? ((w * 0.86) / c - 1) / (fan.length - 1) : 0.42);
  return (
    <div className={`lobby-centre${small ? " is-compact" : ""}`}>
      <div className="lobby-fan" style={{ ["--csz" as string]: `${c}px`, ["--n" as string]: fan.length, ["--spread" as string]: spread }} aria-label={`The deck: ${v.settings.deck.map(roleName).join(", ")}`}>
        {fan.map((r, i) => <img key={`${r}${i}`} src={`/art/${r}.webp`} alt="" style={{ ["--i" as string]: i - (fan.length - 1) / 2 }} />)}
        {!fan.length && <img src="/art/back.webp" alt="" style={{ ["--i" as string]: 0 }} />}
      </div>
      <div className="lobby-status">
        <span className="eyebrow">Deck {v.settings.deck.length} of {need}</span>
        <h3>{problem ? (v.players.length < 3 ? "Waiting for players" : "Building the deck") : ctx.host ? "Ready to deal" : "Waiting for the host"}</h3>
        {!small && <p>{problem ?? `${v.players.length} players and ${v.settings.centerCount} cards in the centre.`}</p>}
      </div>
      {ctx.host && !small && <CommandButton id="game.start" variant="primary">Deal the cards</CommandButton>}
    </div>
  );
}
