const schema = require('@colyseus/schema');

class MyRoomState extends schema.Schema {
  constructor(){
    super();
    this.mySynchronizedProperty = "Hello world";
  }
}

schema.defineTypes(MyRoomState, {
  mySynchronizedProperty: "string",
});

exports.MyRoomState = MyRoomState;