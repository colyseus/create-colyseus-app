import { schema, t } from "@colyseus/schema";

export const MyRoomState = schema({
  mySynchronizedProperty: t.string().default("Hello world")
})
