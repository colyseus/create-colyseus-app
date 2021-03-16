import { Schema, Context } from "@colyseus/schema";

export const type = Context.create();

export class MyRoomState extends Schema {

  @type("string") mySynchronizedProperty: string = "Hello world";

}
