import { schema, t } from "@colyseus/schema";

/* @colyseus:state:before */

export const MyRoomState = schema({

  mySynchronizedProperty: t.string().default("Hello world"),
  /* @colyseus:state:fields */

});
