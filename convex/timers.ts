/** The scheduled ends of night turns and of the day. Each checks it is still the timer for the current moment. */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { endDay, endTurn, type Game } from "./game";

export const turnEnds = internalMutation({
  args: { room: v.id("rooms"), round: v.number(), turn: v.number() },
  handler: async (ctx, a) => {
    const room = await ctx.db.get(a.room);
    if (!room || room.phase !== "night" || room.round !== a.round || (room.game as Game).turn !== a.turn) return;
    await endTurn(ctx, room);
  },
});

export const dayEnds = internalMutation({
  args: { room: v.id("rooms"), round: v.number() },
  handler: async (ctx, a) => {
    const room = await ctx.db.get(a.room);
    if (!room || room.phase !== "day" || room.round !== a.round) return;
    await endDay(ctx, room);
  },
});
