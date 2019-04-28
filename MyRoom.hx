import colyseus.server.Room;

class MyRoom extends Room {

    public function new() {
		super();
		// maxClients = 4;
	}

    override function onInit (options:Dynamic) {
        trace("Room created!", options);
    }

    override function onJoin (client, ?options:Dynamic, ?auth:Dynamic) {
        trace("Client " + client.sessionId + " joined.");
        return null;
    }

    override function onLeave(client, ?consented:Bool) {
        trace("Client " + client.sessionId + " left.");
        return null;
    }

    override function onMessage(client, data:Dynamic) {
        trace("Message received");
    }

    override function onDispose () {
        trace("Disposing room");
        return null;
    }
}