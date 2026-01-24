type EventListener = (...args: readonly unknown[]) => void;

export class TestEventEmitter {
  private listeners: Map<string, EventListener[]>;

  constructor() {
    this.listeners = new Map<string, EventListener[]>();
  }

  on = (eventName: string, listener: EventListener): void => {
    const eventListeners = this.listeners.get(eventName) || [];
    eventListeners.push(listener);
    this.listeners.set(eventName, eventListeners);
  };

  emit = (eventName: string, ...args: readonly unknown[]): void => {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        listener(...args);
      });
    }
  };

  removeListener = (eventName: string, listener: EventListener): void => {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const filteredListeners = eventListeners.filter((l) => l !== listener);
      if (filteredListeners.length > 0) {
        this.listeners.set(eventName, filteredListeners);
      } else {
        this.listeners.delete(eventName);
      }
    }
  };

  removeAllListeners = (eventName?: string): void => {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  };
}
