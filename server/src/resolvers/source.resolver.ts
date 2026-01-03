import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Source } from '../types';
import { PrismaService } from '../prisma';

/**
 * Source Resolver
 *
 * @Resolver() tells NestJS this class contains GraphQL resolvers
 * @Injectable() allows this class to receive injected dependencies
 * Each method with @Query() becomes a GraphQL query
 */
@Resolver(() => Source)
@Injectable()
export class SourceResolver {
  /**
   * Constructor injection - NestJS automatically provides PrismaService
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all sources
   *
   * @Query() creates a GraphQL query field
   * Returns array of Source objects from the database
   */
  @Query(() => [Source])
  async sources(): Promise<Source[]> {
    return this.prisma.source.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single source by ID
   *
   * @Args() defines query arguments
   * ID type is a special GraphQL scalar for unique identifiers
   */
  @Query(() => Source, { nullable: true })
  async source(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Source | null> {
    return this.prisma.source.findUnique({
      where: { id },
    });
  }
}
