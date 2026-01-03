import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

/**
 * Canonical algorithm - deduplicated across sources
 */
@ObjectType()
export class Algorithm {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  normalizedMoves: string;

  @Field(() => Int)
  moveCount: number;

  @Field(() => Date)
  createdAt: Date;

  // Relations will be added later
  // @Field(() => [AlgorithmOccurrence])
  // occurrences: AlgorithmOccurrence[];

  // @Field(() => [NgramOccurrence])
  // ngramOccurrences: NgramOccurrence[];
}
