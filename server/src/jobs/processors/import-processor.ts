import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AlgorithmParserService } from '../../services/algorithm-parser.service';
import { SubscriptionService } from '../../services/subscription.service';
import { ProcessImportJobData, JOB_QUEUES } from '../types';
import { ImportStatus } from '../../types/enums';
import { AlgType } from '../../types/enums';

interface ParsedAlgorithm {
  originalMoves: string;
  normalizedMoves: string;
  moveCount: number;
  algType: AlgType;
  caseName?: string;
}

/**
 * Import Processor
 *
 * Processes algorithm imports by:
 * 1. Parsing the algorithms text
 * 2. Creating canonical algorithms and occurrences
 * 3. Extracting n-grams
 * 4. Updating import run status
 */
@Processor(JOB_QUEUES.IMPORT_PROCESSING)
@Injectable()
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly algorithmParser: AlgorithmParserService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    super();
  }

  async process(job: Job<ProcessImportJobData>): Promise<void> {
    const { importRunId, sourceId, algorithmsText } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing import ${importRunId} from source ${sourceId}`);

    try {
      // Update status to PROCESSING
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: {
          status: ImportStatus.PROCESSING,
          processedAlgorithms: 0,
        },
      });

      // Publish initial progress
      this.subscriptionService.publishImportProgress(importRunId, {
        totalAlgorithms: 0,
        processedAlgorithms: 0,
        status: 'Parsing algorithms...',
        percentage: 0,
      });

      // Parse algorithms from text
      const parsedAlgorithms =
        this.algorithmParser.parseAlgorithmsText(algorithmsText);

      this.logger.log(`Parsed ${parsedAlgorithms.length} algorithms`);

      // Update total count
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: { totalAlgorithms: parsedAlgorithms.length },
      });

      // Publish parsing complete
      this.subscriptionService.publishImportProgress(importRunId, {
        totalAlgorithms: parsedAlgorithms.length,
        processedAlgorithms: 0,
        status: 'Processing algorithms...',
        percentage: 5,
      });

      let processedCount = 0;

      // Process each algorithm
      for (const parsed of parsedAlgorithms) {
        await this.processAlgorithm(importRunId, sourceId, parsed);
        processedCount++;

        const percentage = Math.floor((processedCount / parsedAlgorithms.length) * 90) + 5; // 5-95%

        // Update progress every 5 algorithms or on last algorithm
        if (processedCount % 5 === 0 || processedCount === parsedAlgorithms.length) {
          await this.prisma.importRun.update({
            where: { id: importRunId },
            data: { processedAlgorithms: processedCount },
          });

          // Update job progress
          await job.updateProgress(percentage);

          // Publish real-time progress
          this.subscriptionService.publishImportProgress(importRunId, {
            totalAlgorithms: parsedAlgorithms.length,
            processedAlgorithms: processedCount,
            currentAlgorithm: parsed.originalMoves,
            status: `Processing algorithm ${processedCount}/${parsedAlgorithms.length}`,
            percentage,
          });
        }
      }

      // Final completion
      const duration = Date.now() - startTime;
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: {
          status: ImportStatus.COMPLETED,
          processedAlgorithms: processedCount,
          endedAt: new Date(),
        },
      });

      // Publish completion
      this.subscriptionService.publishImportCompleted(importRunId, {
        totalAlgorithms: parsedAlgorithms.length,
        processedAlgorithms: processedCount,
        newTriggersCount: 0, // Will be updated by aggregate processor
        duration,
      });

      this.logger.log(
        `Completed import ${importRunId}: processed ${processedCount} algorithms in ${duration}ms`,
      );

      // TODO: Trigger aggregate computation job
      // await this.aggregateQueue.add('compute-aggregates', { importRunId });
    } catch (error) {
      this.logger.error(`Failed to process import ${importRunId}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: {
          status: ImportStatus.FAILED,
          errorMessage,
          endedAt: new Date(),
        },
      });

      // Publish failure
      this.subscriptionService.publishImportFailed(importRunId, {
        message: errorMessage,
        processedAlgorithms: 0, // Could track this if needed
        totalAlgorithms: 0,
      });

      throw error;
    }
  }

  /**
   * Process a single parsed algorithm
   */
  private async processAlgorithm(
    importRunId: string,
    sourceId: string,
    parsed: ParsedAlgorithm,
  ): Promise<void> {
    // Find or create canonical algorithm
    const algorithm = await this.prisma.algorithm.upsert({
      where: { normalizedMoves: parsed.normalizedMoves },
      update: {}, // No updates needed if it exists
      create: {
        normalizedMoves: parsed.normalizedMoves,
        moveCount: parsed.moveCount,
      },
    });

    // Create algorithm occurrence (provenance)
    await this.prisma.algorithmOccurrence.create({
      data: {
        algorithmId: algorithm.id,
        sourceId,
        importRunId,
        algType: parsed.algType,
        originalMoves: parsed.originalMoves,
        caseName: parsed.caseName,
      },
    });

    // Extract and store n-grams
    const ngrams = this.algorithmParser.extractNgrams(parsed.normalizedMoves);

    for (const ngramMoves of ngrams) {
      // Find or create n-gram
      const ngram = await this.prisma.ngram.upsert({
        where: { moves: ngramMoves },
        update: {}, // No updates needed if it exists
        create: {
          moves: ngramMoves,
          length: ngramMoves.split(' ').length,
        },
      });

      // Create n-gram occurrence
      const position = parsed.normalizedMoves.indexOf(ngramMoves);

      // Only create if this exact occurrence doesn't exist
      await this.prisma.ngramOccurrence.upsert({
        where: {
          ngramId_algorithmId_position: {
            ngramId: ngram.id,
            algorithmId: algorithm.id,
            position,
          },
        },
        update: {}, // No updates needed
        create: {
          ngramId: ngram.id,
          algorithmId: algorithm.id,
          position,
        },
      });
    }
  }
}
