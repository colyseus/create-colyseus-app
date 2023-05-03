import colyseus.server.Room;

class MyRoom extends Room {
	public function new() {
		super();
	}

	override function onCreate(options:Dynamic) {
		trace("Room created!", options);

		this.onMessage("type", function(client, message) {
			// Handle message here
		});
	}

	override function onJoin(client, ?options:Dynamic, ?auth:Dynamic) {
		trace("Client " + client.sessionId + " joined.");
		return null;
	}

	override function onLeave(client, ?consented:Bool) {
		trace("Client " + client.sessionId + " left.");
		return null;
	}

	override function onDispose() {
		trace("Disposing room");
		return null;
	}
}
