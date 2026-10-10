export type Unsubscribe = () => void;

/** Minimal typed event emitter, so events know their payloads. */
export class Emitter<Events extends Record<string, unknown>> {
  private listeners: { [E in keyof Events]?: Set<(payload: Events[E]) => void> } = {};

  on<E extends keyof Events>(event: E, fn: (payload: Events[E]) => void): Unsubscribe {
    const set = (this.listeners[event] ??= new Set());
    set.add(fn);
    return () => set.delete(fn);
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    for (const fn of [...(this.listeners[event] ?? [])]) fn(payload);
  }

  clear(): void {
    this.listeners = {};
  }
}
