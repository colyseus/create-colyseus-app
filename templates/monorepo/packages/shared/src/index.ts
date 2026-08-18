import { schema, t, type SchemaType } from "@colyseus/schema";

export const Item = schema({
    name: t.string(),
});
export type Item = SchemaType<typeof Item>;

export const Player = schema({
    items: t.array(Item),
});
export type Player = SchemaType<typeof Player>;

export const MyState = schema({
    players: t.map(Player),
});
export type MyState = SchemaType<typeof MyState>;
