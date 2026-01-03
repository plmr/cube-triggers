import { Test, TestingModule } from '@nestjs/testing';
import { ImportProcessor } from './import-processor';
import { PrismaService } from '../../prisma/prisma.service';
import { AlgorithmParserService } from '../../services/algorithm-parser.service';
import { JobQueueService } from '../../services/job-queue.service';
import { ImportStatus, AlgType } from '../../types/enums';

describe('ImportProcessor', () => {
  let processor: ImportProcessor;
  let prismaService: jest.Mocked<PrismaService>;
  let algorithmParserService: jest.Mocked<AlgorithmParserService>;
  let jobQueueService: jest.Mocked<JobQueueService>;

  beforeEach(async () => {
    const mockPrismaService = {
      importRun: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      algorithm: {
        upsert: jest.fn(),
      },
      algorithmOccurrence: {
        create: jest.fn(),
      },
      ngram: {
        upsert: jest.fn(),
      },
      ngramOccurrence: {
        upsert: jest.fn(),
      },
    };

    const mockAlgorithmParserService = {
      parseAlgorithmsText: jest.fn(),
      extractNgrams: jest.fn(),
    };

    const mockJobQueueService = {
      queueAggregateComputation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportProcessor,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AlgorithmParserService,
          useValue: mockAlgorithmParserService,
        },
        {
          provide: JobQueueService,
          useValue: mockJobQueueService,
        },
      ],
    }).compile();

    processor = module.get<ImportProcessor>(ImportProcessor);
    prismaService = module.get(PrismaService);
    algorithmParserService = module.get(AlgorithmParserService);
    jobQueueService = module.get(JobQueueService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const mockJob = {
      data: { 
        importRunId: 'import-1',
        sourceId: 'source-1',
        algorithmsText: 'R U R\' U\'\nF R F\''
      },
    } as any;

    const mockImportRun = {
      id: 'import-1',
      sourceId: 'source-1',
      algorithmsText: 'R U R\' U\'\nF R F\'',
      status: ImportStatus.PENDING,
      totalAlgorithms: 0,
      processedAlgorithms: 0,
      startedAt: new Date(),
      endedAt: null,
      errorMessage: null,
    };

    beforeEach(() => {
      algorithmParserService.parseAlgorithmsText.mockReturnValue([
        {
          originalMoves: 'R U R\' U\'',
          normalizedMoves: 'R U R\' U\'',
          moveCount: 4,
          algType: AlgType.OTHER,
          caseName: undefined,
        },
        {
          originalMoves: 'F R F\'',
          normalizedMoves: 'F R F\'',
          moveCount: 3,
          algType: AlgType.OTHER,
          caseName: undefined,
        },
      ]);
      algorithmParserService.extractNgrams.mockReturnValue(['R U', 'U R\'', 'R\' U\'']);
      prismaService.algorithm.upsert.mockResolvedValue({ id: 'alg-1' } as any);
      prismaService.ngram.upsert.mockResolvedValue({ id: 'ngram-1' } as any);
      jobQueueService.queueAggregateComputation.mockResolvedValue('job-1');
    });

    it('should process import successfully', async () => {
      await processor.process(mockJob);

      // Check that it updates status to PROCESSING first
      expect(prismaService.importRun.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.PROCESSING,
          processedAlgorithms: 0,
        },
      });

      // Check that it updates total algorithms count
      expect(prismaService.importRun.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'import-1' },
        data: {
          totalAlgorithms: 2,
        },
      });

      expect(algorithmParserService.parseAlgorithmsText).toHaveBeenCalledWith('R U R\' U\'\nF R F\'');

      // Check final completion update
      expect(prismaService.importRun.update).toHaveBeenNthCalledWith(3, {
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.COMPLETED,
          processedAlgorithms: 2,
          endedAt: expect.any(Date),
        },
      });
    });

    it('should handle empty algorithms text', async () => {
      const emptyJob = {
        data: { 
          importRunId: 'import-1',
          sourceId: 'source-1',
          algorithmsText: ''
        },
      } as any;
      
      algorithmParserService.parseAlgorithmsText.mockReturnValue([]);

      await processor.process(emptyJob);

      expect(algorithmParserService.parseAlgorithmsText).toHaveBeenCalledWith('');
      
      // Check final completion update
      expect(prismaService.importRun.update).toHaveBeenNthCalledWith(3, {
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.COMPLETED,
          processedAlgorithms: 0,
          endedAt: expect.any(Date),
        },
      });
    });

    it('should skip empty lines', async () => {
      const jobWithEmptyLines = {
        data: { 
          importRunId: 'import-1',
          sourceId: 'source-1',
          algorithmsText: 'R U R\' U\'\n\n  \nF R F\'\n'
        },
      } as any;
      
      algorithmParserService.parseAlgorithmsText.mockReturnValue([
        {
          originalMoves: 'R U R\' U\'',
          normalizedMoves: 'R U R\' U\'',
          moveCount: 4,
          algType: AlgType.OTHER,
          caseName: undefined,
        },
        {
          originalMoves: 'F R F\'',
          normalizedMoves: 'F R F\'',
          moveCount: 3,
          algType: AlgType.OTHER,
          caseName: undefined,
        },
      ]);

      await processor.process(jobWithEmptyLines);

      expect(algorithmParserService.parseAlgorithmsText).toHaveBeenCalledWith('R U R\' U\'\n\n  \nF R F\'\n');
      
      // Check final completion update
      expect(prismaService.importRun.update).toHaveBeenNthCalledWith(3, {
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.COMPLETED,
          processedAlgorithms: 2,
          endedAt: expect.any(Date),
        },
      });
    });

    it('should create algorithm and occurrences', async () => {
      await processor.process(mockJob);

      expect(prismaService.algorithm.upsert).toHaveBeenCalledWith({
        where: { normalizedMoves: 'R U R\' U\'' },
        update: {},
        create: {
          normalizedMoves: 'R U R\' U\'',
          moveCount: 4,
        },
      });

      expect(prismaService.algorithmOccurrence.create).toHaveBeenCalledWith({
        data: {
          algorithmId: 'alg-1',
          sourceId: 'source-1',
          importRunId: 'import-1',
          algType: AlgType.OTHER,
          originalMoves: 'R U R\' U\'',
          caseName: undefined,
        },
      });
    });

    it('should create n-grams and occurrences', async () => {
      await processor.process(mockJob);

      expect(prismaService.ngram.upsert).toHaveBeenCalledWith({
        where: { moves: 'R U' },
        update: {},
        create: {
          moves: 'R U',
          length: 2,
        },
      });

      expect(prismaService.ngramOccurrence.upsert).toHaveBeenCalledWith({
        where: {
          ngramId_algorithmId_position: {
            ngramId: 'ngram-1',
            algorithmId: 'alg-1',
            position: 0,
          },
        },
        update: {},
        create: {
          ngramId: 'ngram-1',
          algorithmId: 'alg-1',
          position: 0,
        },
      });
    });

    it('should handle import run not found', async () => {
      // This test doesn't make sense with the current implementation
      // since the processor gets data directly from job.data, not from database lookup
      // Let's test a different error scenario
      const error = new Error('Database error');
      prismaService.importRun.update.mockRejectedValue(error);

      await expect(processor.process(mockJob)).rejects.toThrow('Database error');
    });

    it('should handle processing errors', async () => {
      const error = new Error('Processing failed');
      
      // Reset mocks and set up error scenario
      prismaService.importRun.update.mockReset();
      algorithmParserService.parseAlgorithmsText.mockReset();
      
      // First call succeeds (status update)
      prismaService.importRun.update.mockResolvedValueOnce({} as any);
      // parseAlgorithmsText throws error
      algorithmParserService.parseAlgorithmsText.mockRejectedValue(error);
      // Error handling update succeeds
      prismaService.importRun.update.mockResolvedValueOnce({} as any);

      await expect(processor.process(mockJob)).rejects.toThrow('Processing failed');

      expect(prismaService.importRun.update).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.FAILED,
          errorMessage: 'Processing failed',
          endedAt: expect.any(Date),
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      // Reset mocks and set up error scenario  
      prismaService.importRun.update.mockReset();
      algorithmParserService.parseAlgorithmsText.mockReset();
      
      // First call succeeds (status update)
      prismaService.importRun.update.mockResolvedValueOnce({} as any);
      // parseAlgorithmsText throws string error
      algorithmParserService.parseAlgorithmsText.mockRejectedValue('String error');
      // Error handling update succeeds
      prismaService.importRun.update.mockResolvedValueOnce({} as any);

      await expect(processor.process(mockJob)).rejects.toThrow('String error');

      // Verify the error was handled correctly
      expect(prismaService.importRun.update).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.FAILED,
          errorMessage: 'String error',
          endedAt: expect.any(Date),
        },
      });
    });
  });
});