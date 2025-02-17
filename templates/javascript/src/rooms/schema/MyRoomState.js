const schema = require('@colyseus/schema');

exports.MyRoomState = schema.schema({
  mySynchronizedProperty: "string",
})
