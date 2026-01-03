// Shared types for the CubeTriggers frontend

export interface FilterState {
  algType?: string;
  sourceId?: string;
  length?: number;
  minOccurrences?: number;
}

export interface Source {
  id: string;
  name: string;
  description?: string;
  url?: string;
  createdAt: string;
}

export interface NgramAggregate {
  id: string;
  totalOccurrences: number;
  algorithmCoverage: number;
  sourceCoverage: number;
  algType?: string;
  sourceId?: string;
  updatedAt: string;
  ngram: {
    id: string;
    moves: string;
    length: number;
  };
}

export interface ImportRun {
  id: string;
  status: string;
  totalAlgorithms: number;
  processedAlgorithms: number;
  startedAt: string;
  endedAt?: string;
  errorMessage?: string;
}