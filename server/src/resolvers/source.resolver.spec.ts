import { Test, TestingModule } from '@nestjs/testing';
import { SourceResolver } from './source.resolver';
import { PrismaService } from '../prisma/prisma.service';

describe('SourceResolver', () => {
  let resolver: SourceResolver;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      source: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourceResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<SourceResolver>(SourceResolver);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('sources', () => {
    it('should return all sources', async () => {
      const mockSources = [
        {
          id: 'source-1',
          name: 'Test Source 1',
          description: 'First test source',
          url: 'https://example1.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'source-2',
          name: 'Test Source 2',
          description: null,
          url: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.source.findMany.mockResolvedValue(mockSources);

      const result = await resolver.sources();

      expect(prismaService.source.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSources);
    });

    it('should return empty array when no sources exist', async () => {
      prismaService.source.findMany.mockResolvedValue([]);

      const result = await resolver.sources();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      prismaService.source.findMany.mockRejectedValue(error);

      await expect(resolver.sources()).rejects.toThrow('Database connection failed');
    });
  });

  describe('source', () => {
    it('should return source by id', async () => {
      const mockSource = {
        id: 'source-1',
        name: 'Test Source',
        description: 'A test source',
        url: 'https://example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.source.findUnique.mockResolvedValue(mockSource);

      const result = await resolver.source('source-1');

      expect(prismaService.source.findUnique).toHaveBeenCalledWith({
        where: { id: 'source-1' },
      });
      expect(result).toEqual(mockSource);
    });

    it('should return null for non-existent source', async () => {
      prismaService.source.findUnique.mockResolvedValue(null);

      const result = await resolver.source('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Source not found');
      prismaService.source.findUnique.mockRejectedValue(error);

      await expect(resolver.source('source-1')).rejects.toThrow('Source not found');
    });
  });
});