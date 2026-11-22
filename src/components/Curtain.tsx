/**
 * The moments between phases: a short full-screen card that says what just changed (night falls, dawn, the votes are
 * in). It never blocks a click, and with reduced motion it is a plain fade.
 */
import { useEffect, useState } from "react";
import { ROLE } from "../../shared/roles";
import { notices } from "../app/knowledge";
import { usePrevious, useApp } from "../app/store";
import { IconMoon, IconSun, IconVote } from "./icons";

interface Show { key: number; kind: "night" | "day" | "vote" | "ended"; title: string; sub: string }

export function Curtain() {
  const { view } = useApp();
  const phase = view?.phase, round = view?.round;
  const prev = usePrevious(phase ? `${phase}:${round}` : undefined);
  const [show, setShow] = useState<Show | null>(null);
  useEffect(() => {
    if (!view || !prev) return;
    const [pp] = prev.split(":");
    if (`${phase}:${round}` === prev) return;
    const mine = view.game?.mine;
    if (phase === "night" && pp !== "night") {
      setShow({ key: Date.now(), kind: "night", title: "Night falls", sub: mine ? `You were dealt the ${ROLE[mine.dealt].name}. Read your card and queue your move.` : "You are watching this round." });
    } else if (phase === "day" && pp === "night") {
      setShow({ key: Date.now(), kind: "day", title: "Dawn", sub: notices(view).length ? `${notices(view).map(n => n.title).join(". ")}. Look at your panel.` : "The cards lie where the night left them. Talk it over; when everyone is ready, the vote opens." });
    } else if (phase === "vote" && pp === "day") {
      setShow({ key: Date.now(), kind: "vote", title: "The vote", sub: `The talking is over. ${view.settings.voteSeconds ?? 20} seconds: click the player you would eliminate.` });
    } else if (phase === "ended" && (pp === "vote" || pp === "day")) {
      setShow({ key: Date.now(), kind: "ended", title: "The votes are in", sub: view.game?.final?.outcome.headline ?? "" });
    }
  }, [phase, round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!show) return; const t = setTimeout(() => setShow(null), 2300); return () => clearTimeout(t); }, [show]);
  if (!show) return null;
  return (
    <div key={show.key} className={`curtain curtain-${show.kind}`} role="status" aria-live="polite">
      <div className="curtain-body">
        <span className="curtain-glyph">{show.kind === "night" ? <IconMoon size={56} strokeWidth={1.2} /> : show.kind === "day" ? <IconSun size={56} strokeWidth={1.2} /> : <IconVote size={56} strokeWidth={1.2} />}</span>
        <h2>{show.title}</h2>
        <p>{show.sub}</p>
      </div>
    </div>
  );
}
