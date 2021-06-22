import { Schema, defineTypes } from '@colyseus/schema';

class MyRoomState extends Schema {}

defineTypes(MyRoomState, {
  mySynchronizedProperty: "string",
});

export { MyRoomState }