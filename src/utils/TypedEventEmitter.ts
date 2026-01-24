/**
 * Type-safe event emitter with strongly-typed event payloads
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap = Record<string, (...args: any[]) => void>;

type EventKey<T extends EventMap> = string & keyof T;
type EventListener<T extends EventMap, K extends EventKey<T>> = T[K];

export class TypedEventEmitter<T extends EventMap> {
  private listeners: Map<EventKey<T>, Set<EventListener<T, EventKey<T>>>> =
    new Map();

  on<K extends EventKey<T>>(eventName: K, listener: EventListener<T, K>): this {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener as EventListener<T, EventKey<T>>);
    return this;
  }

  once<K extends EventKey<T>>(eventName: K, listener: EventListener<T, K>): this {
    const onceWrapper = ((...args: Parameters<EventListener<T, K>>) => {
      this.off(eventName, onceWrapper as EventListener<T, K>);
      listener(...args);
    }) as EventListener<T, K>;

    return this.on(eventName, onceWrapper);
  }

  off<K extends EventKey<T>>(eventName: K, listener: EventListener<T, K>): this {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener<T, EventKey<T>>);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
    return this;
  }

  emit<K extends EventKey<T>>(
    eventName: K,
    ...args: Parameters<EventListener<T, K>>
  ): boolean {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners || eventListeners.size === 0) {
      return false;
    }

    eventListeners.forEach((listener) => {
      (listener as EventListener<T, K>)(...args);
    });

    return true;
  }

  removeAllListeners<K extends EventKey<T>>(eventName?: K): this {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  listenerCount<K extends EventKey<T>>(eventName: K): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }

  eventNames(): Array<EventKey<T>> {
    return Array.from(this.listeners.keys());
  }
}
