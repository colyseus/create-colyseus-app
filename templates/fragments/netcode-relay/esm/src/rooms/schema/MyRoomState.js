import { schema, t } from "@colyseus/schema";

/* @colyseus:state:before */

export const Player = schema({
  x: t.number().default(0),
  y: t.number().default(0),
  angle: t.number().default(0),
});

export const MyRoomState = schema({

  players: t.map(Player),
  /* @colyseus:state:fields */

});
