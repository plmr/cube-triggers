import { Test, TestingModule } from '@nestjs/testing';
import { NgramResolver } from './ngram.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { AlgType } from '../types/enums';

describe('NgramResolver', () => {
  let resolver: NgramResolver;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      ngram: {
        findMany: jest.fn(),
      },
      ngramAggregate: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NgramResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<NgramResolver>(NgramResolver);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('ngramsByLength', () => {
    it('should return n-grams of specified length', async () => {
      const mockNgrams = [
        {
          id: 'ngram-1',
          moves: 'R U',
          length: 2,
          createdAt: new Date(),
        },
        {
          id: 'ngram-2',
          moves: 'U R\'',
          length: 2,
          createdAt: new Date(),
        },
      ];

      prismaService.ngram.findMany.mockResolvedValue(mockNgrams);

      const result = await resolver.ngramsByLength(2);

      expect(prismaService.ngram.findMany).toHaveBeenCalledWith({
        where: { length: 2 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockNgrams);
    });

    it('should return empty array for length with no n-grams', async () => {
      prismaService.ngram.findMany.mockResolvedValue([]);

      const result = await resolver.ngramsByLength(10);

      expect(result).toEqual([]);
    });
  });

  describe('searchTriggers', () => {
    it('should find n-grams containing the search moves', async () => {
      const mockNgrams = [
        {
          id: 'ngram-1',
          moves: 'R U R\'',
          length: 3,
          createdAt: new Date(),
        },
        {
          id: 'ngram-2',
          moves: 'U R\' U\'',
          length: 3,
          createdAt: new Date(),
        },
      ];

      prismaService.ngram.findMany.mockResolvedValue(mockNgrams);

      const result = await resolver.searchTriggers('R U');

      expect(prismaService.ngram.findMany).toHaveBeenCalledWith({
        where: {
          moves: {
            contains: 'R U',
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockNgrams);
    });

    it('should return empty array when no matches found', async () => {
      prismaService.ngram.findMany.mockResolvedValue([]);

      const result = await resolver.searchTriggers('X Y Z');

      expect(result).toEqual([]);
    });
  });

  describe('topTriggers', () => {
    it('should return top triggers without filters', async () => {
      const mockAggregates = [
        {
          id: 'agg-1',
          ngramId: 'ngram-1',
          sourceId: null,
          algType: null,
          totalOccurrences: 10,
          algorithmCoverage: 5,
          sourceCoverage: 2,
          updatedAt: new Date(),
        },
        {
          id: 'agg-2',
          ngramId: 'ngram-2',
          sourceId: null,
          algType: null,
          totalOccurrences: 8,
          algorithmCoverage: 4,
          sourceCoverage: 2,
          updatedAt: new Date(),
        },
      ];

      prismaService.ngramAggregate.findMany.mockResolvedValue(mockAggregates);

      const result = await resolver.topTriggers();

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
      expect(result).toEqual(mockAggregates);
    });

    it('should apply algType filter', async () => {
      const filters = { algType: AlgType.PLL };
      const mockAggregates = [
        {
          id: 'agg-1',
          ngramId: 'ngram-1',
          sourceId: null,
          algType: AlgType.PLL,
          totalOccurrences: 10,
          algorithmCoverage: 5,
          sourceCoverage: 2,
          updatedAt: new Date(),
        },
      ];

      prismaService.ngramAggregate.findMany.mockResolvedValue(mockAggregates);

      const result = await resolver.topTriggers(filters);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: { algType: AlgType.PLL },
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
      expect(result).toEqual(mockAggregates);
    });

    it('should apply sourceId filter', async () => {
      const filters = { sourceId: 'source-1' };
      
      await resolver.topTriggers(filters);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: { sourceId: 'source-1' },
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
    });

    it('should apply minOccurrences filter', async () => {
      const filters = { minOccurrences: 5 };
      
      await resolver.topTriggers(filters);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: { 
          totalOccurrences: { gte: 5 }
        },
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
    });

    it('should apply length filter with ngram join', async () => {
      const filters = { length: 3 };
      
      await resolver.topTriggers(filters);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: { 
          ngram: { length: 3 }
        },
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
    });

    it('should apply multiple filters', async () => {
      const filters = { 
        algType: AlgType.OLL, 
        sourceId: 'source-1', 
        minOccurrences: 3,
        length: 2
      };
      
      await resolver.topTriggers(filters);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: { 
          algType: AlgType.OLL,
          sourceId: 'source-1',
          totalOccurrences: { gte: 3 },
          ngram: { length: 2 }
        },
        orderBy: { totalOccurrences: 'desc' },
        take: 50,
      });
    });

    it('should respect custom limit', async () => {
      await resolver.topTriggers(undefined, 10);

      expect(prismaService.ngramAggregate.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { totalOccurrences: 'desc' },
        take: 10,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database query failed');
      prismaService.ngramAggregate.findMany.mockRejectedValue(error);

      await expect(resolver.topTriggers()).rejects.toThrow('Database query failed');
    });
  });
});