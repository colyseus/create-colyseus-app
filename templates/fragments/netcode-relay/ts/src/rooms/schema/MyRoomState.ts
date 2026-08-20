import { schema, t, type SchemaType } from "@colyseus/schema";

/* @colyseus:state:before */

export const Player = schema({
  x: t.number().default(0),
  y: t.number().default(0),
  angle: t.number().default(0),
});
export type Player = SchemaType<typeof Player>;

export const MyRoomState = schema({

  players: t.map(Player),
  /* @colyseus:state:fields */

});
export type MyRoomState = SchemaType<typeof MyRoomState>;
