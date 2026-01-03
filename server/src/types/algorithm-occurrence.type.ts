import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AlgType } from './enums';

/**
 * Tracks where each algorithm appears (provenance)
 * This maintains the connection between canonical algorithms and their sources
 */
@ObjectType()
export class AlgorithmOccurrence {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  algorithmId: string;

  @Field(() => String)
  sourceId: string;

  @Field(() => String)
  importRunId: string;

  @Field(() => AlgType)
  algType: AlgType;

  @Field(() => String)
  originalMoves: string;

  @Field(() => String, { nullable: true })
  caseName: string | null;

  @Field(() => Date)
  createdAt: Date;

  // Relations will be added later
  // @Field(() => Algorithm)
  // algorithm: Algorithm;

  // @Field(() => Source)
  // source: Source;

  // @Field(() => ImportRun)
  // importRun: ImportRun;
}
