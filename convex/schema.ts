import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const grant = v.union(v.literal("read"), v.literal("act"), v.literal("host"));

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    phase: v.union(v.literal("lobby"), v.literal("night"), v.literal("day"), v.literal("vote"), v.literal("ended")),
    /** Incremented at every deal, so a timer scheduled for an earlier round does nothing. */
    round: v.number(),
    host: v.optional(v.id("players")),
    settings: v.object({
      deck: v.array(v.string()), centerCount: v.number(), duskSeconds: v.number(), turnSeconds: v.number(), daySeconds: v.number(),
      /** The vote phase's length; 20 s when absent. */
      voteSeconds: v.optional(v.number()),
      /** Rule variants (shared/settings.ts); missing ones take their defaults. */
      rules: v.optional(v.record(v.string(), v.union(v.boolean(), v.number(), v.string()))),
      /** Play-test tables only: a fixed seed, seating and/or cards for the next deal. */
      fixedDeal: v.optional(v.object({ seed: v.optional(v.number()), seats: v.optional(v.array(v.id("players"))), cards: v.optional(v.array(v.string())), nightSeed: v.optional(v.number()) })),
    }),
    /** A play-test table: chosen at creation, shown to everyone; its host may fix the deal and sees every card. */
    playtest: v.optional(v.boolean()),
    /** The game in progress (convex/game.ts `Game`). It holds hidden information: only convex/rooms.ts reads it out. */
    game: v.optional(v.any()),
  }).index("code", ["code"]),

  players: defineTable({
    room: v.id("rooms"),
    /** The secret a browser keeps in localStorage; a bot has none. */
    token: v.optional(v.string()),
    name: v.string(),
    bot: v.boolean(),
    /** The last heartbeat (convex/presence.ts): the only source of what others see of this player's connection. */
    lastSeenAt: v.optional(v.number()),
  }).index("room", ["room"]).index("token", ["token", "room"]),

  /** Table talk. Public to everyone in the room. */
  messages: defineTable({
    room: v.id("rooms"),
    round: v.number(),
    phase: v.string(),
    player: v.id("players"),
    name: v.string(),
    text: v.string(),
    /** How it was sent: by the person at the app, or by an assistant acting for them over MCP. */
    via: v.union(v.literal("app"), v.literal("agent")),
    /** signed: the game vouches it came from the player dealt Signet. unsigned: the sender's name is withheld until the game ends. */
    mark: v.optional(v.union(v.literal("signed"), v.literal("unsigned"))),
    /** An authenticated message: the role whose seal it carries ("signet", "notary"). Real and forged look identical. */
    seal: v.optional(v.string()),
    /** A forged seal: revealed only after its game has ended. */
    forged: v.optional(v.boolean()),
  }).index("room", ["room"]),

  /**
   * An assistant's permission to act as one player in one room. Only SHA-256 hashes of secrets are stored.
   * kind "key": a pasted bearer key. kind "oauth": an access token with a rotating refresh token.
   */
  credentials: defineTable({
    tokenHash: v.string(),
    player: v.id("players"),
    room: v.id("rooms"),
    permission: grant,
    label: v.string(),
    kind: v.union(v.literal("key"), v.literal("oauth")),
    clientId: v.optional(v.string()),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    refreshHash: v.optional(v.string()),
    refreshExpiresAt: v.optional(v.number()),
    /** The refresh token this one replaced, kept briefly so a replay revokes the grant. */
    retiredRefreshHash: v.optional(v.string()),
  }).index("token", ["tokenHash"]).index("player", ["player"]).index("refresh", ["refreshHash"]).index("retired", ["retiredRefreshHash"]),

  /** OAuth clients registered by dynamic client registration (RFC 7591). Public clients only. */
  oauthClients: defineTable({
    clientId: v.string(),
    name: v.string(),
    redirectUris: v.array(v.string()),
    /** Hash of the registration metadata: the same metadata gets the same client. */
    metaHash: v.string(),
  }).index("clientId", ["clientId"]).index("meta", ["metaHash"]),

  /** One pass through the OAuth authorization-code flow, from /oauth/authorize to the token exchange. */
  oauthRequests: defineTable({
    keyHash: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    redirectUri: v.string(),
    state: v.optional(v.string()),
    challenge: v.string(),
    scope: grant,
    expiresAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied"), v.literal("released"), v.literal("used")),
    /** Set on approval. */
    player: v.optional(v.id("players")),
    room: v.optional(v.id("rooms")),
    permission: v.optional(grant),
    /** Hash of the secret only the approving browser holds: the code is released to that browser alone. */
    completionHash: v.optional(v.string()),
    codeHash: v.optional(v.string()),
    /** The credential the code produced, so a replayed code revokes it. */
    credential: v.optional(v.id("credentials")),
  }).index("key", ["keyHash"]).index("code", ["codeHash"]),
});
