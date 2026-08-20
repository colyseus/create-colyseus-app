const { schema, t } = require("@colyseus/schema");

/* @colyseus:state:before */

const Player = schema({
  x: t.number().default(0),
  y: t.number().default(0),

  /** Movement intent on each axis, -1..1, set by the "move" message. */
  inputX: t.number().default(0),
  inputY: t.number().default(0),
});
exports.Player = Player;

exports.MyRoomState = schema({

  players: t.map(Player),
  /* @colyseus:state:fields */

});
