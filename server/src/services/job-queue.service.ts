import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { 
  ProcessImportJobData, 
  ComputeAggregatesJobData, 
  JOB_QUEUES 
} from '../jobs/types';

/**
 * Job Queue Service
 * 
 * Manages job queues for background processing
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    @InjectQueue(JOB_QUEUES.IMPORT_PROCESSING) 
    private readonly importQueue: Queue<ProcessImportJobData>,
    
    @InjectQueue(JOB_QUEUES.AGGREGATE_COMPUTATION) 
    private readonly aggregateQueue: Queue<ComputeAggregatesJobData>,
  ) {}

  /**
   * Queue an import processing job
   */
  async queueImportProcessing(data: ProcessImportJobData): Promise<string> {
    const job = await this.importQueue.add('process-import', data, {
      // Job options
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 50,     // Keep last 50 failed jobs for debugging
    });

    this.logger.log(`Queued import processing job ${job.id} for import ${data.importRunId}`);
    return job.id!;
  }

  /**
   * Queue an aggregate computation job
   */
  async queueAggregateComputation(data: ComputeAggregatesJobData): Promise<string> {
    const job = await this.aggregateQueue.add('compute-aggregates', data, {
      // Run after a delay to let import processing complete
      delay: 5000,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 5,
      removeOnFail: 20,
    });

    this.logger.log(`Queued aggregate computation job ${job.id} for import ${data.importRunId}`);
    return job.id!;
  }

  /**
   * Get job status and progress
   */
  async getImportJobStatus(jobId: string) {
    const job = await this.importQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      data: job.data,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [importStats, aggregateStats] = await Promise.all([
      this.importQueue.getJobCounts(),
      this.aggregateQueue.getJobCounts(),
    ]);

    return {
      import: importStats,
      aggregate: aggregateStats,
    };
  }
}