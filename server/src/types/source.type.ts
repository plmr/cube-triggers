import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * GraphQL Object Type for Source
 *
 * @ObjectType() tells NestJS this class represents a GraphQL type
 * @Field() decorators specify which properties are exposed in the API
 */
@ObjectType()
export class Source {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  url: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Relations - we'll add these later when we create the other types
  // @Field(() => [ImportRun])
  // importRuns: ImportRun[];

  // @Field(() => [AlgorithmOccurrence])
  // occurrences: AlgorithmOccurrence[];
}
