import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Ngram, NgramAggregate, AlgType } from '../types';
import { PrismaService } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Input type for filtering n-grams
 * This is what users will use to find the most common triggers
 */
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class NgramFilters {
  @Field(() => Int, { nullable: true })
  length?: number;

  @Field(() => AlgType, { nullable: true })
  algType?: AlgType;

  @Field(() => String, { nullable: true })
  sourceId?: string;

  @Field(() => Int, { nullable: true })
  minOccurrences?: number;
}

/**
 * N-gram Resolver - The heart of CubeTriggers
 *
 * This resolver provides the core functionality:
 * - Finding the most common triggers
 * - Filtering by algorithm type, source, etc.
 * - Getting detailed statistics
 */
@Resolver(() => Ngram)
@Injectable()
export class NgramResolver {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the most common n-grams (triggers)
   * This is the main query users will use
   */
  @Query(() => [NgramAggregate])
  async topTriggers(
    @Args('filters', { nullable: true }) filters?: NgramFilters,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number = 50,
  ): Promise<NgramAggregate[]> {
    // Build the where clause based on filters
    const where: Prisma.NgramAggregateWhereInput = {};

    // Handle algType and sourceId filtering properly
    if (filters?.algType && filters?.sourceId) {
      // Both algType and sourceId specified - use specific aggregate
      where.algType = filters.algType;
      where.sourceId = filters.sourceId;
    } else if (filters?.algType) {
      // Only algType specified - use algType-specific aggregates (sourceId = null)
      where.algType = filters.algType;
      where.sourceId = null;
    } else if (filters?.sourceId) {
      // Only sourceId specified - use source-specific aggregates (algType = null)
      where.algType = null;
      where.sourceId = filters.sourceId;
    } else {
      // No algType or sourceId filters - use global aggregates
      where.algType = null;
      where.sourceId = null;
    }

    // Apply minimum occurrences filter
    if (filters?.minOccurrences) {
      where.totalOccurrences = {
        gte: filters.minOccurrences,
      };
    }

    // Apply length filter by joining with ngrams table
    if (filters?.length) {
      where.ngram = {
        length: filters.length,
      };
    }

    // Add a filter to exclude aggregates with 0 occurrences
    // (these shouldn't exist, but just in case)
    if (!where.totalOccurrences) {
      where.totalOccurrences = { gt: 0 };
    } else {
      // If minOccurrences is already set, make sure it's at least 1
      where.totalOccurrences = {
        gte: Math.max(filters?.minOccurrences || 1, 1),
      };
    }

    return this.prisma.ngramAggregate.findMany({
      where,
      orderBy: { totalOccurrences: 'desc' },
      take: limit,
      include: {
        ngram: true, // Include the ngram relation to get the moves
      },
    });
  }

  /**
   * Get all n-grams of a specific length
   */
  @Query(() => [Ngram])
  async ngramsByLength(
    @Args('length', { type: () => Int }) length: number,
  ): Promise<Ngram[]> {
    return this.prisma.ngram.findMany({
      where: { length },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search for n-grams containing specific moves
   */
  @Query(() => [Ngram])
  async searchTriggers(@Args('moves') moves: string): Promise<Ngram[]> {
    return this.prisma.ngram.findMany({
      where: {
        moves: {
          contains: moves,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
