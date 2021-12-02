package;
import server.rooms.*;
import colyseus.server.Server;
import js.node.Http;

class Main {
	static var PORT: Int = 2567;

	static function main() {
		// Attach WebSocket Server on HTTP Server.
		var gameServer = new Server({ server: Http.createServer() });

		// Register ChatRoom as "chat"
		gameServer.register("my_room", MyRoom);

		gameServer.listen(PORT);

		trace('-- listening on 0.0.0.0:${PORT}... --');
	}
}
