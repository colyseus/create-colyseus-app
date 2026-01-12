const schema = require('@colyseus/schema');

exports.MyRoomState = schema.schema({
  mySynchronizedProperty: { type: "string", default: "Hello world" }
})
