import { schema, t, type SchemaType } from "@colyseus/schema";

export const MyRoomState = schema({

  mySynchronizedProperty: t.string().default("Hello world"),

});
export type MyRoomState = SchemaType<typeof MyRoomState>;
