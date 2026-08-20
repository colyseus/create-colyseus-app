import { schema, t, type SchemaType } from "@colyseus/schema";

/* @colyseus:state:before */

export const MyRoomState = schema({

  mySynchronizedProperty: t.string().default("Hello world"),
  /* @colyseus:state:fields */

});
export type MyRoomState = SchemaType<typeof MyRoomState>;
