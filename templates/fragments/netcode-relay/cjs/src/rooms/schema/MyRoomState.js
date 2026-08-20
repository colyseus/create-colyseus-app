const { schema, t } = require("@colyseus/schema");

/* @colyseus:state:before */

const Player = schema({
  x: t.number().default(0),
  y: t.number().default(0),
  angle: t.number().default(0),
});

exports.MyRoomState = schema({

  players: t.map(Player),
  /* @colyseus:state:fields */

});
exports.Player = Player;
