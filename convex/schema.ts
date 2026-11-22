import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    phase: v.union(v.literal("lobby"), v.literal("night"), v.literal("day"), v.literal("ended")),
    /** Incremented at every deal, so a timer scheduled for an earlier round does nothing. */
    round: v.number(),
    host: v.optional(v.id("players")),
    settings: v.object({ deck: v.array(v.string()), duskSeconds: v.number(), turnSeconds: v.number(), daySeconds: v.number() }),
    /** The game in progress (convex/game.ts `Game`). It holds hidden information: only convex/rooms.ts `view` reads it out. */
    game: v.optional(v.any()),
  }).index("code", ["code"]),
  players: defineTable({
    room: v.id("rooms"),
    /** The secret a browser keeps in localStorage; a bot has none. */
    token: v.optional(v.string()),
    name: v.string(),
    bot: v.boolean(),
  }).index("room", ["room"]).index("token", ["token", "room"]),
});
