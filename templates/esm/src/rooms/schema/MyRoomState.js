import { schema } from "@colyseus/schema";

export const MyRoomState = schema({
  mySynchronizedProperty: { type: "string", default: "Hello world" }
})
