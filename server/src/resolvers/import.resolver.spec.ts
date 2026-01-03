import { Test, TestingModule } from '@nestjs/testing';
import { ImportResolver } from './import.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { JobQueueService } from '../services/job-queue.service';
import { ImportStatus } from '../types/enums';

describe('ImportResolver', () => {
  let resolver: ImportResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let jobQueueService: jest.Mocked<JobQueueService>;

  beforeEach(async () => {
    const mockPrismaService = {
      source: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      importRun: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockJobQueueService = {
      queueImportProcessing: jest.fn(),
      queueAggregateComputation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JobQueueService,
          useValue: mockJobQueueService,
        },
      ],
    }).compile();

    resolver = module.get<ImportResolver>(ImportResolver);
    prismaService = module.get(PrismaService);
    jobQueueService = module.get(JobQueueService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('startImport', () => {
    const mockInput = {
      sourceName: 'Test Source',
      algorithmsText: 'R U R\' U\'\nF R F\'',
      description: 'Test algorithms',
      sourceUrl: 'https://example.com',
    };

    it('should create new source and import run', async () => {
      const mockSource = {
        id: 'source-1',
        name: 'Test Source',
        description: 'Test algorithms',
        url: 'https://example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockImportRun = {
        id: 'import-1',
        sourceId: 'source-1',
        status: ImportStatus.PENDING,
        totalAlgorithms: 0,
        processedAlgorithms: 0,
        startedAt: new Date(),
        endedAt: null,
        errorMessage: null,
      };

      prismaService.source.upsert.mockResolvedValue(mockSource);
      prismaService.importRun.create.mockResolvedValue(mockImportRun);
      jobQueueService.queueImportProcessing.mockResolvedValue('job-1');
      jobQueueService.queueAggregateComputation.mockResolvedValue('job-2');

      const result = await resolver.startImport(mockInput);

      expect(prismaService.source.upsert).toHaveBeenCalledWith({
        where: { name: 'Test Source' },
        update: {
          url: 'https://example.com',
          description: 'Test algorithms',
        },
        create: {
          name: 'Test Source',
          url: 'https://example.com',
          description: 'Test algorithms',
        },
      });

      expect(prismaService.importRun.create).toHaveBeenCalledWith({
        data: {
          sourceId: 'source-1',
          status: ImportStatus.PENDING,
          totalAlgorithms: 0,
          processedAlgorithms: 0,
        },
      });

      expect(jobQueueService.queueImportProcessing).toHaveBeenCalledWith({ 
        importRunId: 'import-1',
        sourceId: 'source-1',
        algorithmsText: 'R U R\' U\'\nF R F\''
      });
      expect(jobQueueService.queueAggregateComputation).toHaveBeenCalledWith({ importRunId: 'import-1' });
      expect(result).toEqual(mockImportRun);
    });

    it('should create source without optional fields', async () => {
      const minimalInput = {
        sourceName: 'Minimal Source',
        algorithmsText: 'R U R\'',
      };

      const mockSource = {
        id: 'source-2',
        name: 'Minimal Source',
        description: null,
        url: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockImportRun = {
        id: 'import-2',
        sourceId: 'source-2',
        status: ImportStatus.PENDING,
        totalAlgorithms: 0,
        processedAlgorithms: 0,
        startedAt: new Date(),
        endedAt: null,
        errorMessage: null,
      };

      prismaService.source.upsert.mockResolvedValue(mockSource);
      prismaService.importRun.create.mockResolvedValue(mockImportRun);
      jobQueueService.queueImportProcessing.mockResolvedValue('job-2');
      jobQueueService.queueAggregateComputation.mockResolvedValue('job-3');

      const result = await resolver.startImport(minimalInput);

      expect(prismaService.source.upsert).toHaveBeenCalledWith({
        where: { name: 'Minimal Source' },
        update: {
          url: undefined,
          description: undefined,
        },
        create: {
          name: 'Minimal Source',
          url: undefined,
          description: undefined,
        },
      });

      expect(result).toEqual(mockImportRun);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      prismaService.source.upsert.mockRejectedValue(error);

      await expect(resolver.startImport(mockInput)).rejects.toThrow('Database connection failed');
    });

    it('should handle job queue errors', async () => {
      const mockSource = {
        id: 'source-1',
        name: 'Test Source',
        description: 'Test algorithms',
        url: 'https://example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockImportRun = {
        id: 'import-1',
        sourceId: 'source-1',
        status: ImportStatus.PENDING,
        totalAlgorithms: 0,
        processedAlgorithms: 0,
        startedAt: new Date(),
        endedAt: null,
        errorMessage: null,
      };

      prismaService.source.upsert.mockResolvedValue(mockSource);
      prismaService.importRun.create.mockResolvedValue(mockImportRun);
      
      const queueError = new Error('Queue service unavailable');
      jobQueueService.queueImportProcessing.mockRejectedValue(queueError);

      await expect(resolver.startImport(mockInput)).rejects.toThrow('Queue service unavailable');
    });
  });

  describe('importRun', () => {
    it('should return import run by id', async () => {
      const mockImportRun = {
        id: 'import-1',
        sourceId: 'source-1',
        status: ImportStatus.COMPLETED,
        totalAlgorithms: 5,
        processedAlgorithms: 5,
        startedAt: new Date(),
        endedAt: new Date(),
        errorMessage: null,
      };

      prismaService.importRun.findUnique.mockResolvedValue(mockImportRun);

      const result = await resolver.importRun('import-1');

      expect(prismaService.importRun.findUnique).toHaveBeenCalledWith({
        where: { id: 'import-1' },
      });
      expect(result).toEqual(mockImportRun);
    });

    it('should return null for non-existent import run', async () => {
      prismaService.importRun.findUnique.mockResolvedValue(null);

      const result = await resolver.importRun('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('importRuns', () => {
    it('should return all import runs when no sourceId provided', async () => {
      const mockImportRuns = [
        {
          id: 'import-1',
          sourceId: 'source-1',
          status: ImportStatus.COMPLETED,
          totalAlgorithms: 5,
          processedAlgorithms: 5,
          startedAt: new Date(),
          endedAt: new Date(),
          errorMessage: null,
        },
        {
          id: 'import-2',
          sourceId: 'source-2',
          status: ImportStatus.PENDING,
          totalAlgorithms: 0,
          processedAlgorithms: 0,
          startedAt: new Date(),
          endedAt: null,
          errorMessage: null,
        },
      ];

      prismaService.importRun.findMany.mockResolvedValue(mockImportRuns);

      const result = await resolver.importRuns();

      expect(prismaService.importRun.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toEqual(mockImportRuns);
    });

    it('should filter by sourceId when provided', async () => {
      const mockImportRuns = [
        {
          id: 'import-1',
          sourceId: 'source-1',
          status: ImportStatus.COMPLETED,
          totalAlgorithms: 5,
          processedAlgorithms: 5,
          startedAt: new Date(),
          endedAt: new Date(),
          errorMessage: null,
        },
      ];

      prismaService.importRun.findMany.mockResolvedValue(mockImportRuns);

      const result = await resolver.importRuns('source-1');

      expect(prismaService.importRun.findMany).toHaveBeenCalledWith({
        where: { sourceId: 'source-1' },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toEqual(mockImportRuns);
    });
  });
});