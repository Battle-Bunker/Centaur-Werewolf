/** What you know about a card, pinned to it on the table: "Saw Werewolf", "Moved", "Shown Herald". */
import type { Marker } from "../app/knowledge";
import { IconEye } from "./icons";

export function Pin({ m }: { m: Marker }) {
  return (
    <span className={`pin pin-${m.tone}${m.team ? ` team-${m.team}` : ""}`} title={m.title}>
      {m.role ? <img src={`/art/${m.role}.webp`} alt="" /> : m.tone === "shown" ? <IconEye size={11} /> : <span className="pin-dot" />}
      {m.tone === "shown" && m.role && <IconEye size={11} />}
      <span>{m.label}</span>
    </span>
  );
}
