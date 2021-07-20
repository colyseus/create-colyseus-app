import * as schema from "@colyseus/schema";

export class MyRoomState extends schema.Schema {
  constructor() {
    super();
    this.mySynchronizedProperty = "Hello world";
  }
}

schema.defineTypes(MyRoomState, {
  mySynchronizedProperty: "string",
});
