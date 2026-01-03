import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ImportRun, ImportStatus } from '../types';
import { PrismaService } from '../prisma';
import { JobQueueService } from '../services';
import { InputType, Field } from '@nestjs/graphql';

/**
 * Input for starting an algorithm import
 */
@InputType()
export class StartImportInput {
  @Field(() => String)
  sourceName: string;

  @Field(() => String, { nullable: true })
  sourceUrl: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  algorithmsText: string; // Raw text containing algorithms
}

/**
 * Import Resolver - Handles algorithm ingestion
 * 
 * This resolver manages the import workflow:
 * - Starting imports (mutations)
 * - Querying import history
 */
@Resolver(() => ImportRun)
@Injectable()
export class ImportResolver {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobQueue: JobQueueService,
  ) {}

  /**
   * Start importing algorithms from text
   * 
   * @Mutation() creates GraphQL mutation fields (write operations)
   * This will trigger background processing
   */
  @Mutation(() => ImportRun)
  async startImport(
    @Args('input') input: StartImportInput
  ): Promise<ImportRun> {
    // 1. Create or find Source
    const source = await this.prisma.source.upsert({
      where: { name: input.sourceName },
      update: {
        url: input.sourceUrl,
        description: input.description,
      },
      create: {
        name: input.sourceName,
        url: input.sourceUrl,
        description: input.description,
      },
    });

    // 2. Create ImportRun
    const importRun = await this.prisma.importRun.create({
      data: {
        sourceId: source.id,
        status: ImportStatus.PENDING,
        totalAlgorithms: 0, // Will be updated when we parse the text
        processedAlgorithms: 0,
      },
    });

    // 3. Queue background job for processing
    await this.jobQueue.queueImportProcessing({
      importRunId: importRun.id,
      sourceId: source.id,
      algorithmsText: input.algorithmsText,
    });

    // 4. Queue aggregate computation (will run after import completes)
    await this.jobQueue.queueAggregateComputation({
      importRunId: importRun.id,
    });
    
    return importRun;
  }

  /**
   * Get import run by ID
   */
  @Query(() => ImportRun, { nullable: true })
  async importRun(
    @Args('id') id: string
  ): Promise<ImportRun | null> {
    return this.prisma.importRun.findUnique({
      where: { id },
    });
  }

  /**
   * Get all import runs for a source
   */
  @Query(() => [ImportRun])
  async importRuns(
    @Args('sourceId', { nullable: true }) sourceId?: string
  ): Promise<ImportRun[]> {
    const where = sourceId ? { sourceId } : {};
    
    return this.prisma.importRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
    });
  }
}