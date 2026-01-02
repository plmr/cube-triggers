import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ImportStatus } from './enums';

/**
 * Tracks batches of algorithm imports
 */
@ObjectType()
export class ImportRun {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  sourceId: string;

  @Field(() => ImportStatus)
  status: ImportStatus;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt: Date | null;

  @Field(() => Int)
  totalAlgorithms: number;

  @Field(() => Int)
  processedAlgorithms: number;

  @Field(() => String, { nullable: true })
  errorMessage: string | null;

  // Relations will be added later
  // @Field(() => Source)
  // source: Source;
  
  // @Field(() => [AlgorithmOccurrence])
  // occurrences: AlgorithmOccurrence[];
}