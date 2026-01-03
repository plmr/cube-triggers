import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

/**
 * N-gram represents a contiguous sequence of moves (triggers)
 * This is the core entity for analysis - what users want to discover
 */
@ObjectType()
export class Ngram {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  moves: string;

  @Field(() => Int)
  length: number;

  @Field(() => Date)
  createdAt: Date;

  // Relations will be added later
  // @Field(() => [NgramOccurrence])
  // occurrences: NgramOccurrence[];

  // @Field(() => [NgramAggregate])
  // aggregates: NgramAggregate[];
}

/**
 * Links n-grams to the algorithms they appear in
 */
@ObjectType()
export class NgramOccurrence {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  ngramId: string;

  @Field(() => String)
  algorithmId: string;

  @Field(() => Int)
  position: number;

  @Field(() => Date)
  createdAt: Date;

  // Relations will be added later
  // @Field(() => Ngram)
  // ngram: Ngram;

  // @Field(() => Algorithm)
  // algorithm: Algorithm;
}
