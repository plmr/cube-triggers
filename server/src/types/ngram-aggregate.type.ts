import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { AlgType } from './enums';

/**
 * Materialized aggregates for fast querying
 * This is where the magic happens - pre-computed statistics
 */
@ObjectType()
export class NgramAggregate {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  ngramId: string;

  // Aggregation dimensions - nullable means "all" of that dimension
  @Field(() => AlgType, { nullable: true })
  algType: AlgType | null;

  @Field(() => String, { nullable: true })
  sourceId: string | null;

  // The computed metrics users care about
  @Field(() => Int)
  totalOccurrences: number;

  @Field(() => Int)
  algorithmCoverage: number;

  @Field(() => Int)
  sourceCoverage: number;

  @Field(() => Date)
  updatedAt: Date;

  // Relations will be added later
  // @Field(() => Ngram)
  // ngram: Ngram;

  // @Field(() => Source, { nullable: true })
  // source?: Source;
}
