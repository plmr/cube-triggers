import { gql } from '@apollo/client';

// Query to get all sources
export const GET_SOURCES = gql`
  query GetSources {
    sources {
      id
      name
      description
      url
      createdAt
    }
  }
`;

// Query to get top triggers with filtering
export const GET_TOP_TRIGGERS = gql`
  query GetTopTriggers($filters: NgramFilters, $limit: Int) {
    topTriggers(filters: $filters, limit: $limit) {
      id
      totalOccurrences
      algorithmCoverage
      sourceCoverage
      algType
      sourceId
      updatedAt
      ngram {
        id
        moves
        length
      }
    }
  }
`;

// Query to get n-grams by length
export const GET_NGRAMS_BY_LENGTH = gql`
  query GetNgramsByLength($length: Int!) {
    ngramsByLength(length: $length) {
      id
      moves
      length
      createdAt
    }
  }
`;

// Query to search triggers by moves
export const SEARCH_TRIGGERS = gql`
  query SearchTriggers($moves: String!) {
    searchTriggers(moves: $moves) {
      id
      moves
      length
      createdAt
    }
  }
`;

// Mutation to start an import
export const START_IMPORT = gql`
  mutation StartImport($input: StartImportInput!) {
    startImport(input: $input) {
      id
      status
      totalAlgorithms
      processedAlgorithms
      startedAt
      errorMessage
    }
  }
`;

// Query to get import runs
export const GET_IMPORT_RUNS = gql`
  query GetImportRuns($sourceId: String) {
    importRuns(sourceId: $sourceId) {
      id
      status
      totalAlgorithms
      processedAlgorithms
      startedAt
      endedAt
      errorMessage
    }
  }
`;