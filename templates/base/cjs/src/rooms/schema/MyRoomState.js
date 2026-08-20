const { schema, t } = require("@colyseus/schema");

/* @colyseus:state:before */

exports.MyRoomState = schema({

  mySynchronizedProperty: t.string().default("Hello world"),
  /* @colyseus:state:fields */

});
