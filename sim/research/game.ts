/**
 * Loads the games of one or more arena run directories (sim/arena.ts output) into one plain record per game, and
 * renders the two texts the research instruments need: the PUBLIC transcript (what every player could see) and the
 * post-game TRUTH. Used by metrics.ts and judge.ts.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Seat { seat: number; name: string; dealt: string; endedHolding: string; endedOnTeam: string; won: boolean; why?: string; votedFor: string; voteWasRandom: boolean; votesReceived: number; eliminated: boolean; bitten?: boolean; imago?: boolean; cursed?: boolean; cutOff?: { by: string; forSeconds: number }[] }
export interface Msg { n?: number; from: string; seat: number | null; phase: string; text: string; verified?: string; FORGED?: string }
export interface Game {
  dir: string; label: string; group: string; code: string; players: number; center: number; deck: string[]; rules: Record<string, unknown>;
  headline: string; notes: string[]; winningTeam: string; eliminated: string[]; seats: Seat[]; centre: string[]; dealtCentre: string[]; nightLog: string[];
  votes: string[]; daySwap: unknown; proclamations: { card: string; was: string; madeDuring: string; FORGED?: string }[]; marks: { what: string; on: string }[];
  chat: Msg[]; timeline: Record<string, any>; agents: { name: string; costUsd: number; debrief?: unknown }[]; run: Record<string, any>; table: Record<string, any>;
  fingerprint: string | null; judges: Judgement[];
}
export interface Judgement { judge: string; tomRequired: number; deceptionCleverness: number; pathDependence: number; pivot: string; noise: number; howWon: string; howWonLabel: string; counterfactual: string; summary: string }

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

/** Every finished game under the given run directories (each holds one sub-directory per table). */
export function loadGames(dirs: string[]): Game[] {
  const games: Game[] = [];
  for (const out of dirs) for (const d of readdirSync(out, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort(natural)) {
    const dir = join(out, d);
    if (!existsSync(`${dir}/result.json`) || !existsSync(`${dir}/table.json`)) continue;
    const v = read(`${dir}/result.json`), table = read(`${dir}/table.json`);
    if (!v.result) continue;
    const r = v.result;
    const timeline = existsSync(`${dir}/timeline.json`) ? read(`${dir}/timeline.json`) : {};
    const judges = readdirSync(dir).filter(f => /^judge-\d+\.json$/.test(f)).sort().map(f => read(`${dir}/${f}`) as Judgement);
    games.push({
      dir, label: table.config.label, group: table.config.label.replace(/#\d+$/, ""), code: table.code, players: table.seats.length, center: table.config.center,
      deck: table.config.deck, rules: table.config.rules ?? {}, headline: r.headline, notes: r.notes ?? [], winningTeam: r.winningTeam, eliminated: r.eliminated ?? [],
      seats: r.seats, centre: r.centre ?? [], dealtCentre: r.dealtCentre ?? [], nightLog: r.nightLog ?? [], votes: r.votes ?? [], daySwap: r.daySwap ?? null,
      proclamations: v.proclamations ?? [], marks: v.marks ?? [], chat: v.chat ?? [], timeline,
      agents: existsSync(`${dir}/agents.json`) ? read(`${dir}/agents.json`) : [], run: existsSync(`${dir}/run.json`) ? read(`${dir}/run.json`) : {}, table,
      fingerprint: r.scenario?.fingerprint ?? timeline.fingerprint ?? null, judges,
    });
  }
  return games;
}
function natural(a: string, b: string) { return a.localeCompare(b, undefined, { numeric: true }); }

/** Seat number of a vote label like "Esme (seat 1)". */
export const seatOf = (label: string): number | null => { const m = /\(seat (\d+)\)/.exec(label ?? ""); return m ? Number(m[1]) : null; };

const secs = (ms: number | undefined) => (ms === undefined ? "?" : `${Math.round(ms / 1000)}s`);

/** What every player could see: the table, the public record of the night, the discussion, who got ready and voted. */
export function publicTranscript(g: Game): string {
  const L: string[] = [];
  L.push(`TABLE: ${g.players} players, ${g.center} centre cards. Deck (public): ${g.deck.join(", ")}.`);
  const nonDefault = Object.entries(g.rules).map(([k, x]) => `${k}=${x}`).join(", ");
  L.push(`Table rules: the defaults${nonDefault ? `, except ${nonDefault}` : ""} (Blood Price on unless stated: the Centaurs win only if more Werewolves than Centaur-team players are eliminated; at least 2 votes to eliminate; ties eliminate everyone tied).`);
  L.push(`Seats: ${g.seats.map(s => `${s.seat}: ${s.name}`).join(", ")} (clockwise).`);
  if (g.proclamations.length) L.push(`Proclamations published at dawn: ${g.proclamations.map(p => `"${p.card} was ${p.was}" (${p.madeDuring})`).join("; ")}.`);
  if (g.marks.length) L.push(`Public marks at dawn: ${g.marks.map(m => `${m.what} on ${m.on}`).join("; ")}.`);
  const t0 = g.timeline.phases?.day;
  L.push("", "DISCUSSION (chat, in order):");
  const day = g.chat.filter(m => m.phase === "day" || m.phase === "vote");
  day.forEach((m, i) => {
    const at = g.timeline.messagesAt?.[i] !== undefined && t0 !== undefined ? ` [+${secs(g.timeline.messagesAt[i] - t0)}]` : "";
    L.push(`${m.from}${at}: ${m.text}${m.verified ? `  {${m.verified}}` : ""}`);
  });
  for (const r of g.timeline.ready ?? []) if (t0 !== undefined) L.push(`(at +${secs(r.at - t0)}: ready to vote: ${r.who.join(", ") || "nobody"})`);
  if (g.timeline.phases?.vote !== undefined && t0 !== undefined) L.push(`VOTE PHASE opened at +${secs(g.timeline.phases.vote - t0)} (chat closed; ballots secret until the end).`);
  return L.join("\n");
}

/** The post-game truth: deal, night, final cards, every vote, the result. */
export function truth(g: Game): string {
  const L: string[] = [];
  L.push(`RESULT: ${g.headline}${g.notes.length ? " " + g.notes.join(" ") : ""} Winning team: ${g.winningTeam}. Eliminated: ${g.eliminated.join(", ") || "nobody"}.`);
  for (const s of g.seats) L.push(`- ${s.name} (seat ${s.seat}): dealt ${s.dealt}, ended holding ${s.endedHolding} (${s.endedOnTeam})${s.bitten ? ", BITTEN" : ""}${s.imago ? ", IMAGO" : ""}; voted ${s.votedFor}${s.voteWasRandom ? " (RANDOM: did not vote in time)" : ""}; got ${s.votesReceived} vote(s)${s.eliminated ? ", ELIMINATED" : ""}; ${s.won ? "WON" : "lost"}${s.cutOff?.length ? `; cut off by ${s.cutOff.map(c => c.by).join(", ")}` : ""}.`);
  L.push(`Centre dealt: ${g.dealtCentre.join(", ")}; centre at the end: ${g.centre.join(", ")}.`);
  if (g.daySwap) L.push(`Day swap: ${JSON.stringify(g.daySwap)}.`);
  L.push("Night log (what each seat did and saw; [truly X] marks a distorted look):");
  for (const l of g.nightLog) L.push(`  ${l}`);
  const forged = g.chat.filter(m => m.FORGED).map(m => `${m.from}: ${m.text}`);
  if (forged.length) L.push(`Forged seals: ${forged.join(" | ")}`);
  const forgedP = g.proclamations.filter(p => p.FORGED).map(p => `${p.card} was ${p.was}`);
  if (forgedP.length) L.push(`Forged proclamations: ${forgedP.join(" | ")}`);
  return L.join("\n");
}
