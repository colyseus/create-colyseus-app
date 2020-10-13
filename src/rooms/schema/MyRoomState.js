const schema = require('@colyseus/schema');

class MyRoomState extends schema.Schema {}

schema.defineTypes(MyRoomState, {
  mySynchronizedProperty: "string",
});

exports.MyRoomState = MyRoomState;