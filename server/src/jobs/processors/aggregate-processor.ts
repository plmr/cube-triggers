import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ComputeAggregatesJobData, JOB_QUEUES } from '../types';
import { AlgType } from '../../types/enums';
import { Prisma } from '@prisma/client';

/**
 * Aggregate Processor
 *
 * Computes materialized aggregates for fast n-gram queries:
 * - Total occurrences per n-gram
 * - Algorithm coverage (how many distinct algorithms contain it)
 * - Source coverage (how many sources contain it)
 * - Breakdowns by algorithm type and source
 */
@Processor(JOB_QUEUES.AGGREGATE_COMPUTATION)
@Injectable()
export class AggregateProcessor extends WorkerHost {
  private readonly logger = new Logger(AggregateProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ComputeAggregatesJobData>): Promise<void> {
    const { importRunId } = job.data;

    this.logger.log(`Computing aggregates for import ${importRunId}`);

    try {
      // Get all n-grams that were affected by this import
      const affectedNgrams = await this.getAffectedNgrams(importRunId);

      this.logger.log(
        `Computing aggregates for ${affectedNgrams.length} n-grams`,
      );

      let processed = 0;

      for (const ngram of affectedNgrams) {
        await this.computeNgramAggregates(ngram.id);
        processed++;

        if (processed % 100 === 0) {
          await job.updateProgress((processed / affectedNgrams.length) * 100);
        }
      }

      this.logger.log(
        `Completed aggregate computation for import ${importRunId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to compute aggregates for import ${importRunId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all n-grams that were created or updated during this import
   */
  private async getAffectedNgrams(importRunId: string) {
    return this.prisma.ngram.findMany({
      where: {
        occurrences: {
          some: {
            algorithm: {
              occurrences: {
                some: {
                  importRunId,
                },
              },
            },
          },
        },
      },
      select: { id: true },
    });
  }

  /**
   * Compute all aggregate combinations for a specific n-gram
   */
  private async computeNgramAggregates(ngramId: string): Promise<void> {
    // Global aggregate (all sources, all algorithm types)
    await this.computeAggregate(ngramId, null, null);

    // Per-algorithm-type aggregates
    for (const algType of Object.values(AlgType)) {
      await this.computeAggregate(ngramId, algType, null);
    }

    // Per-source aggregates
    const sources = await this.prisma.source.findMany({ select: { id: true } });
    for (const source of sources) {
      await this.computeAggregate(ngramId, null, source.id);

      // Per-source-per-algorithm-type aggregates
      for (const algType of Object.values(AlgType)) {
        await this.computeAggregate(ngramId, algType, source.id);
      }
    }
  }

  /**
   * Compute aggregate for a specific n-gram, algorithm type, and source combination
   */
  private async computeAggregate(
    ngramId: string,
    algType: AlgType | null,
    sourceId: string | null,
  ): Promise<void> {
    // Build the where clause for filtering occurrences
    const whereClause: Prisma.NgramOccurrenceWhereInput = {
      ngramId,
    };

    if (algType || sourceId) {
      whereClause.algorithm = {
        occurrences: {
          some: {
            ...(algType && { algType }),
            ...(sourceId && { sourceId }),
          },
        },
      };
    }

    // Count total occurrences
    const totalOccurrences = await this.prisma.ngramOccurrence.count({
      where: whereClause,
    });

    // Count distinct algorithms
    const algorithmCoverage = await this.prisma.ngramOccurrence
      .groupBy({
        by: ['algorithmId'],
        where: whereClause,
      })
      .then((results) => results.length);

    // Count distinct sources
    const sourceCoverageQuery = await this.prisma.ngramOccurrence.findMany({
      where: whereClause,
      select: {
        algorithm: {
          select: {
            occurrences: {
              select: { sourceId: true },
              where: {
                ...(algType && { algType }),
                ...(sourceId && { sourceId }),
              },
            },
          },
        },
      },
    });

    const uniqueSources = new Set(
      sourceCoverageQuery.flatMap((occ) =>
        occ.algorithm.occurrences.map((algOcc) => algOcc.sourceId),
      ),
    );
    const sourceCoverage = uniqueSources.size;

    // Create or update the aggregate
    const existingAggregate = await this.prisma.ngramAggregate.findFirst({
      where: {
        ngramId,
        algType,
        sourceId,
      },
    });

    if (existingAggregate) {
      await this.prisma.ngramAggregate.update({
        where: { id: existingAggregate.id },
        data: {
          totalOccurrences,
          algorithmCoverage,
          sourceCoverage,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.ngramAggregate.create({
        data: {
          ngramId,
          algType,
          sourceId,
          totalOccurrences,
          algorithmCoverage,
          sourceCoverage,
        },
      });
    }
  }
}
