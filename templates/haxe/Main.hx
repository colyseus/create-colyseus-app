package;
import colyseus.server.Express;
import colyseus.server.Colyseus.defineServer;
import colyseus.server.Colyseus.defineRoom;
import colyseus.server.Colyseus.monitor;
import colyseus.server.Colyseus.playground;

class Main {
	static var PORT: Int = 2567;

	static function main() {
		// Attach WebSocket Server on HTTP Server.
		var serverDef = defineServer({
			devMode: true,
			rooms: {
				STATE_HANDLER: defineRoom(StateHandlerRoom),
				VIEW_ROOM: defineRoom(ViewRoom),
			},
			express: (app) -> {
				app.get("/hi", (req, res) -> {
					res.send("It's time to kick ass and chew bubblegum!");
				});
				app.use(
					"/monitor", 
					ExpressAuth.create({
						users: {
							"admin": "admin"
						},
						challenge: true
					}),
					monitor()
				);
				app.use("/", playground());
			}
		});

		serverDef.onShutdown(function() {
			trace('game server is going down.');
			return null;
		});

		serverDef.listen(PORT);
		
		trace('-- listening on 0.0.0.0:${PORT}... --');
	}
}
