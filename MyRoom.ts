import { Room, Client } from "colyseus";

export class MyRoom extends Room {

  onCreate (options: any) {
  }

  onJoin (client: Client, options: any) {
  }

  onMessage (client: Client, message: any) {
  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
