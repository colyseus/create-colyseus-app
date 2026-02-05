package;
import colyseus.server.Room;
import colyseus.server.schema.Schema;

class StateHandlerRoom extends Room {

	var myState:MyState;
	override function onCreate(options:Dynamic) {
		trace("StateHandlerRoom created!", options);
		myState = new MyState();
		this.state = myState;
		autoDispose = false;
		onMessage(
			"message",
			(client, data) -> {
				trace("StateHandlerRoom received message from", client.sessionId, ":", data);
				myState.movePlayer(client.sessionId, data);
			}
		);
	}

	override function onDrop(client, ?code) {
		return this.allowReconnection(client, 20);
	}

	override function onJoin(client, ?options:Dynamic) {
		myState.createPlayer(client.sessionId);
		return null;
	}

	override function onLeave(client, ?code:Int) {
		myState.removePlayer(client.sessionId);
		return null;
	}

	override function onDispose() {
		trace("Dispose StateHandlerRoom");
		return null;
	}
}

class Player extends Schema {
	@:type(NUMBER)
	public var x:Float; 

	@:type(NUMBER)
	public var y:Float;

	public function new() {
		super();
		x = Math.floor(Math.random() * 400);
		y = Math.floor(Math.random() * 400);
	}
}

class MyState extends Schema {
	@:type({map: Player})
	public var players:MapSchema<Player>;

	public var something:String = "This attribute won't be sent to the client-side";

	public function new() {
		super();
		players = new MapSchema<Player>();
	}

	public function createPlayer(id: String) {
		players.set(id, new Player());
	}

	public function removePlayer(id: String) {
		players.delete(id);
	}

	public function movePlayer(id: String, movement: Point) {
		if (movement.x != null) {
			players.get(id).x += movement.x * 10;
		}
		if (movement.y != null) {
			players.get(id).y += movement.y * 10;
		}
	}
}

typedef Point = {x:Int, y:Int};