import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Import Progress Subscription Payload
 * Real-time updates during algorithm import processing
 */
@ObjectType()
export class ImportProgressPayload {
  @Field(() => String)
  importRunId: string;

  @Field(() => Int)
  totalAlgorithms: number;

  @Field(() => Int)
  processedAlgorithms: number;

  @Field(() => String, { nullable: true })
  currentAlgorithm?: string;

  @Field(() => String)
  status: string;

  @Field(() => Int)
  percentage: number;

  @Field(() => String)
  timestamp: string;
}

/**
 * Import Completed Subscription Payload
 * Notification when import processing finishes successfully
 */
@ObjectType()
export class ImportCompletedPayload {
  @Field(() => String)
  importRunId: string;

  @Field(() => Int)
  totalAlgorithms: number;

  @Field(() => Int)
  processedAlgorithms: number;

  @Field(() => Int)
  newTriggersCount: number;

  @Field(() => Int)
  duration: number;

  @Field(() => String)
  timestamp: string;
}

/**
 * Import Failed Subscription Payload
 * Notification when import processing fails
 */
@ObjectType()
export class ImportFailedPayload {
  @Field(() => String)
  importRunId: string;

  @Field(() => String)
  message: string;

  @Field(() => Int)
  processedAlgorithms: number;

  @Field(() => Int)
  totalAlgorithms: number;

  @Field(() => String)
  timestamp: string;
}

/**
 * Triggers Updated Subscription Payload
 * Notification when new triggers are computed and available
 */
@ObjectType()
export class TriggersUpdatedPayload {
  @Field(() => String, { nullable: true })
  sourceId?: string;

  @Field(() => String)
  timestamp: string;
}