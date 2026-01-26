import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class Item extends Schema {
    @type("string") name!: string;
}

export class Player extends Schema {
    @type([Item]) items = new ArraySchema<Item>();
}

export class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}