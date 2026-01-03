/**
 * Job Types and Payloads for BullMQ
 */

export interface ProcessImportJobData {
  importRunId: string;
  sourceId: string;
  algorithmsText: string;
}

export interface ProcessAlgorithmJobData {
  importRunId: string;
  sourceId: string;
  algorithmText: string;
  algType: string;
  caseName?: string;
}

export interface ComputeAggregatesJobData {
  // Trigger aggregate computation after import completes
  importRunId: string;
}

// Job queue names
export const JOB_QUEUES = {
  IMPORT_PROCESSING: 'import-processing',
  ALGORITHM_PROCESSING: 'algorithm-processing',
  AGGREGATE_COMPUTATION: 'aggregate-computation',
} as const;
