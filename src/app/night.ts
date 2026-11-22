/** Where this player is in the night: their own turn, and for a copier, the turn of the role it became. */
import { turnKey } from "../../shared/engine";
import { ROLE, type RoleId } from "../../shared/roles";
import type { View } from "./store";
import { actsAtNight, isCopier } from "./teams";

export interface MyNight {
  /** Index in game.turns of the turn the dealt card acts in, or -1. */
  ownTurn: number;
  /** The role a copier became, if it has. */
  became: RoleId | null;
  /** Index of the copy's turn (its own role's turn), or -1. */
  copyTurn: number;
  /** Acting now, in either turn, with something still to do. */
  awake: boolean;
  /** The next turn (index) this player acts in, or -1. */
  next: number;
}

export function myNight(v: View): MyNight | null {
  const game = v.game, mine = game?.mine;
  if (!game || !mine) return null;
  const turnOf = (r: RoleId) => game.turns.findIndex(t => t.role === turnKey(r));
  const own = ROLE[mine.dealt];
  const ownTurn = own && actsAtNight(own) ? turnOf(mine.dealt) : -1;
  const became = mine.status.became ?? null;
  const copyTurn = became && ROLE[became] && actsAtNight(ROLE[became]) && !isCopier(became) ? turnOf(became) : -1;
  const night = v.phase === "night";
  const awake = night && ((ownTurn > 0 && game.turn === ownTurn && !mine.progress.done) || (copyTurn > 0 && game.turn === copyTurn && !mine.adoptProgress?.done));
  const next = [ownTurn, copyTurn].filter(t => t > game.turn).sort((a, b) => a - b)[0] ?? -1;
  return { ownTurn, became, copyTurn, awake, next };
}
