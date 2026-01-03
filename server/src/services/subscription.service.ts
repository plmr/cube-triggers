import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

/**
 * Subscription Service
 *
 * Manages real-time GraphQL subscriptions for import progress,
 * trigger updates, and other live data changes.
 */
@Injectable()
export class SubscriptionService {
  private pubSub = new PubSub();

  // Subscription event types
  static readonly EVENTS = {
    IMPORT_PROGRESS: 'IMPORT_PROGRESS',
    IMPORT_COMPLETED: 'IMPORT_COMPLETED',
    IMPORT_FAILED: 'IMPORT_FAILED',
    TRIGGERS_UPDATED: 'TRIGGERS_UPDATED',
  } as const;

  /**
   * Publish import progress update
   */
  publishImportProgress(
    importRunId: string,
    progress: {
      totalAlgorithms: number;
      processedAlgorithms: number;
      currentAlgorithm?: string;
      status: string;
      percentage: number;
    },
  ) {
    void this.pubSub.publish(SubscriptionService.EVENTS.IMPORT_PROGRESS, {
      importProgress: {
        importRunId,
        ...progress,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish import completion
   */
  publishImportCompleted(
    importRunId: string,
    result: {
      totalAlgorithms: number;
      processedAlgorithms: number;
      newTriggersCount: number;
      duration: number;
    },
  ) {
    void this.pubSub.publish(SubscriptionService.EVENTS.IMPORT_COMPLETED, {
      importCompleted: {
        importRunId,
        ...result,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish import failure
   */
  publishImportFailed(
    importRunId: string,
    error: {
      message: string;
      processedAlgorithms: number;
      totalAlgorithms: number;
    },
  ) {
    void this.pubSub.publish(SubscriptionService.EVENTS.IMPORT_FAILED, {
      importFailed: {
        importRunId,
        ...error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish triggers updated (when new n-grams are computed)
   */
  publishTriggersUpdated(sourceId?: string) {
    void this.pubSub.publish(SubscriptionService.EVENTS.TRIGGERS_UPDATED, {
      triggersUpdated: {
        sourceId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get the PubSub instance for use in resolvers
   */
  getPubSub() {
    return this.pubSub;
  }

  /**
   * Subscribe to import progress for a specific import run
   */
  subscribeToImportProgress() {
    return this.pubSub.asyncIterableIterator([
      SubscriptionService.EVENTS.IMPORT_PROGRESS,
    ]);
  }

  /**
   * Subscribe to import completion events
   */
  subscribeToImportCompleted() {
    return this.pubSub.asyncIterableIterator([
      SubscriptionService.EVENTS.IMPORT_COMPLETED,
    ]);
  }

  /**
   * Subscribe to import failure events
   */
  subscribeToImportFailed() {
    return this.pubSub.asyncIterableIterator([
      SubscriptionService.EVENTS.IMPORT_FAILED,
    ]);
  }

  /**
   * Subscribe to trigger updates
   */
  subscribeToTriggersUpdated() {
    return this.pubSub.asyncIterableIterator([
      SubscriptionService.EVENTS.TRIGGERS_UPDATED,
    ]);
  }
}