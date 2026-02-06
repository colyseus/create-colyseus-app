package;

import colyseus.server.Room;
import colyseus.server.Client;
import colyseus.server.schema.Schema;
import colyseus.server.schema.Schema.StateView;

/**
 * Example room demonstrating @:type and @:view decorators with conditional
 * view assignment based on player score.
 *
 * How it works:
 * - x, y, name: public state, sent to ALL clients
 * - score: tagged with @:view (default tag) — only visible via StateView
 * - secretData: tagged with @:view(1) — only visible when tag 1 is granted
 *
 * On join, each client gets a StateView with their own player added (so they
 * can see their own score). When a player's score reaches SCORE_THRESHOLD,
 * the room grants them view tag 1, revealing secretData on all players.
 */
class ViewRoom extends RoomOf<GameState, Dynamic> {
	static inline var SCORE_THRESHOLD = 100;

	override function onCreate(options:Dynamic) {
		trace("ViewRoom created!");
		this.state = new GameState();

		setSimulationInterval((_) -> {
			state.tickCount++;
		}, 1000);

		onMessage("move", (client:Client, data:Dynamic) -> {
			var player = state.players.get(client.sessionId);
			if (player != null) {
				player.x += data.x * 10;
				player.y += data.y * 10;
			}
		});

		onMessage("score", (client:Client, data:Dynamic) -> {
			var player = state.players.get(client.sessionId);
			if (player != null) {
				var prevScore = player.score;
				player.score += data.points;

				// Grant view tag 1 (secretData) when crossing the threshold
				if (prevScore < SCORE_THRESHOLD && player.score >= SCORE_THRESHOLD) {
					grantSecretView(client, player);
				}
			}
		});
	}

	override function onJoin(client, ?options:Dynamic) {
		var player = new PlayerState();
		player.name = 'Player ${client.sessionId}';
		state.players.set(client.sessionId, player);

		// Create a StateView so this client receives @:view tagged fields
		client.view = new StateView();

		// Add the player's own state with default view tag — reveals "score"
		client.view.add(player);

		trace('${player.name} joined');
		return null;
	}

	override function onLeave(client:Client, ?code:Int) {
		var player = state.players.get(client.sessionId);
		if (player != null)
			trace('${player.name} left (code: $code)');

		state.players.delete(client.sessionId);
		return null;
	}

	override function onDispose() {
		trace("ViewRoom disposed");
		return null;
	}

	/**
	 * Grant view tag 1 to a client, making @:view(1) fields (secretData)
	 * visible on ALL current players for that client.
	 */
	function grantSecretView(client:Client, player:PlayerState) {
		trace('${player.name} reached score ${player.score} — granting secret view');

		// Add every player's state with tag 1 so this client sees secretData
		state.players.forEach((entry, key, map) -> {
			client.view.add(entry, 1);
		});
	}
}

/**
 * Player state with view-filtered fields.
 * - x, y, name: sent to ALL clients (public state)
 * - score: @:view (default tag) — visible only when added to client's StateView
 * - secretData: @:view(1) — visible only when tag 1 is granted
 */
class PlayerState extends Schema {
	@:type(NUMBER)
	public var x:Float;

	@:type(NUMBER)
	public var y:Float;

	@:type(STRING)
	public var name:String;

	@:type(INT32)
	@:view
	public var score:Int;

	@:type(STRING)
	@:view(1)
	public var secretData:String;

	public function new() {
		super();
		x = Math.floor(Math.random() * 400);
		y = Math.floor(Math.random() * 400);
		score = 0;
		secretData = "hidden";
	}
}

class GameState extends Schema {
	@:type({map: PlayerState})
	public var players:MapSchema<PlayerState>;

	@:type(STRING)
	public var roomMessage:String;

	@:type(INT32)
	@:view
	public var tickCount:Int;

	public function new() {
		super();
		players = new MapSchema<PlayerState>();
		roomMessage = "Welcome!";
		tickCount = 0;
	}
}
