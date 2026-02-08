type EventListener = (...args: readonly unknown[]) => void;

export class TestEventEmitter {
  private events: Map<string, EventListener[]>;

  constructor() {
    this.events = new Map();
  }

  on = (eventName: string, listener: EventListener): void => {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(listener);
  };

  off = (eventName: string, listener: EventListener): void => {
    const listeners = this.events.get(eventName);
    if (!listeners) {
      return;
    }

    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(eventName);
    }
  };

  emit = (eventName: string, ...args: readonly unknown[]): void => {
    const listeners = this.events.get(eventName);
    if (!listeners) {
      return;
    }

    listeners.forEach(listener => {
      listener(...args);
    });
  };

  removeAllListeners = (eventName?: string): void => {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  };

  listenerCount = (eventName: string): number => {
    return this.events.get(eventName)?.length ?? 0;
  };
}
