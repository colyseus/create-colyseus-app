const { schema, t } = require('@colyseus/schema');

exports.MyRoomState = schema({
  mySynchronizedProperty: t.string().default("Hello world")
})
