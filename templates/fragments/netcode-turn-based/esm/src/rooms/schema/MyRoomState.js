import { schema, t } from "@colyseus/schema";

/* @colyseus:state:before */

export const Player = schema({
  score: t.uint16().default(0),
});

export const MyRoomState = schema({

  players: t.map(Player),

  /** sessionId of whoever may act right now; empty before the match starts. */
  currentTurn: t.string().default(""),

  /** Room-clock time (ms) the current turn expires at. */
  turnDeadline: t.number().default(0),

  turnCount: t.uint16().default(0),
  /* @colyseus:state:fields */

});
