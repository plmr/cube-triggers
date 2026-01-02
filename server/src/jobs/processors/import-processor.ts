import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AlgorithmParserService } from '../../services/algorithm-parser.service';
import { ProcessImportJobData, JOB_QUEUES } from '../types';
import { ImportStatus } from '../../types/enums';

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
  ) {
    super();
  }

  async process(job: Job<ProcessImportJobData>): Promise<void> {
    const { importRunId, sourceId, algorithmsText } = job.data;
    
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

      // Parse algorithms from text
      const parsedAlgorithms = this.algorithmParser.parseAlgorithmsText(algorithmsText);
      
      this.logger.log(`Parsed ${parsedAlgorithms.length} algorithms`);

      // Update total count
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: { totalAlgorithms: parsedAlgorithms.length },
      });

      let processedCount = 0;

      // Process each algorithm
      for (const parsed of parsedAlgorithms) {
        await this.processAlgorithm(importRunId, sourceId, parsed);
        processedCount++;

        // Update progress every 10 algorithms
        if (processedCount % 10 === 0) {
          await this.prisma.importRun.update({
            where: { id: importRunId },
            data: { processedAlgorithms: processedCount },
          });
          
          // Update job progress
          await job.updateProgress((processedCount / parsedAlgorithms.length) * 100);
        }
      }

      // Final update
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: { 
          status: ImportStatus.COMPLETED,
          processedAlgorithms: processedCount,
          endedAt: new Date(),
        },
      });

      this.logger.log(`Completed import ${importRunId}: processed ${processedCount} algorithms`);

      // TODO: Trigger aggregate computation job
      // await this.aggregateQueue.add('compute-aggregates', { importRunId });

    } catch (error) {
      this.logger.error(`Failed to process import ${importRunId}:`, error);
      
      await this.prisma.importRun.update({
        where: { id: importRunId },
        data: { 
          status: ImportStatus.FAILED,
          errorMessage: error.message,
          endedAt: new Date(),
        },
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
    parsed: any
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