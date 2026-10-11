/** The little a session needs from a WebSocket, so tests can hand it a fake one. */
export interface Socket {
  send(data: string): void;
  close(): void;
}

export interface SocketHandlers {
  open(): void;
  message(data: string): void;
  /** The connection ended (also when it never opened). `code` is the WebSocket close code. */
  close(code: number): void;
}

export type OpenSocket = (url: string, handlers: SocketHandlers) => Socket;

/** A real browser WebSocket. */
export const openBrowserSocket: OpenSocket = (url, handlers) => {
  const ws = new WebSocket(url);
  ws.addEventListener('open', () => handlers.open());
  ws.addEventListener('message', (e) => {
    if (typeof e.data === 'string') handlers.message(e.data);
  });
  ws.addEventListener('close', (e) => handlers.close(e.code));
  return {
    send(data) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    },
    close() {
      ws.close(1000);
    },
  };
};
