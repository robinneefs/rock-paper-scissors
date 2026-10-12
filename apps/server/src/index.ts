import { isRoomCode, mathRandomRng, type Clock, type ServerMessage } from '@rps/core';
import { DurableObject } from 'cloudflare:workers';
import { MatchRoom, type Connection } from './MatchRoom';

export interface Env {
  ROOMS: DurableObjectNamespace<RoomObject>;
}

/** The room's clock: real time and timers inside the Durable Object. */
const serverClock: Clock = {
  now: () => Date.now(),
  schedule(ms, fn) {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
  },
};

/**
 * The Worker: `GET /room/ABCD` with a WebSocket upgrade goes to the Durable Object for room ABCD
 * (Cloudflare starts it on demand, one per code). Anything else gets a short status text.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const code = /^\/room\/([A-Z]+)$/.exec(url.pathname)?.[1];
    if (!code) return new Response('RPS Rivals match server\n', { status: url.pathname === '/' ? 200 : 404 });
    if (!isRoomCode(code)) return new Response('Bad room code\n', { status: 400 });
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected a WebSocket\n', { status: 426 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
  },
} satisfies ExportedHandler<Env>;

/** One match room. Holds both players' WebSockets in memory for as long as the match lasts. */
export class RoomObject extends DurableObject<Env> {
  private readonly room = new MatchRoom(serverClock, mathRandomRng);

  override async fetch(): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    server.accept();
    const conn: Connection = {
      send(msg: ServerMessage) {
        try {
          server.send(JSON.stringify(msg));
        } catch {
          // already closed; the close handler tidies up
        }
      },
      close(code, reason) {
        try {
          server.close(code, reason);
        } catch {
          // already closed
        }
      },
    };
    server.addEventListener('message', (e) => this.room.receive(conn, e.data));
    server.addEventListener('close', () => this.room.leave(conn));
    server.addEventListener('error', () => this.room.leave(conn));
    return new Response(null, { status: 101, webSocket: client });
  }
}
