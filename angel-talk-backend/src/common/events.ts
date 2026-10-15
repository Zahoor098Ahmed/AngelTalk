import { EventEmitter } from "events";
import { OutboxEventType } from "./types";
import { logger } from "./logger";

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: OutboxEventType;
  payload: T;
  timestamp: Date;
}

class AppEventEmitter extends EventEmitter {
  public publish<T extends Record<string, unknown>>(type: OutboxEventType, payload: T): void {
    const event: DomainEvent<T> = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type,
      payload,
      timestamp: new Date(),
    };
    logger.debug({ eventType: type, eventId: event.id }, "Publishing domain event");
    this.emit(type, event);
    this.emit("*", event);
  }

  public subscribe<T extends Record<string, unknown>>(
    type: OutboxEventType,
    handler: (event: DomainEvent<T>) => Promise<void> | void
  ): void {
    this.on(type, (event: DomainEvent<T>) => {
      Promise.resolve(handler(event)).catch((err) => {
        logger.error({ err, eventType: type, eventId: event.id }, "Error handling domain event");
      });
    });
  }
}

export const eventBus = new AppEventEmitter();

