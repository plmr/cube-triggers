import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { JobQueueService } from './job-queue.service';
import { JOB_QUEUES } from '../jobs/types';

describe('JobQueueService', () => {
  let service: JobQueueService;
  let mockImportQueue: any;
  let mockAggregateQueue: any;

  beforeEach(async () => {
    mockImportQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      getJobs: jest.fn(),
    };

    mockAggregateQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      getJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobQueueService,
        {
          provide: getQueueToken(JOB_QUEUES.IMPORT_PROCESSING),
          useValue: mockImportQueue,
        },
        {
          provide: getQueueToken(JOB_QUEUES.AGGREGATE_COMPUTATION),
          useValue: mockAggregateQueue,
        },
      ],
    }).compile();

    service = module.get<JobQueueService>(JobQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueImportProcessing', () => {
    it('should queue import processing job', async () => {
      const jobData = { importRunId: 'test-import-id' };
      
      mockImportQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await service.queueImportProcessing(jobData);

      expect(mockImportQueue.add).toHaveBeenCalledWith(
        'process-import',
        jobData,
        expect.any(Object)
      );
      expect(result).toBe('job-1');
    });

    it('should use correct job options', async () => {
      const jobData = { importRunId: 'test-import-id' };
      mockImportQueue.add.mockResolvedValue({ id: 'job-1' });
      
      await service.queueImportProcessing(jobData);

      const [, , options] = mockImportQueue.add.mock.calls[0];
      expect(options).toHaveProperty('attempts', 3);
      expect(options).toHaveProperty('backoff');
      expect(options.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });
  });

  describe('queueAggregateComputation', () => {
    it('should queue aggregate computation job', async () => {
      const jobData = { importRunId: 'test-import-id' };
      
      mockAggregateQueue.add.mockResolvedValue({ id: 'job-2' });

      const result = await service.queueAggregateComputation(jobData);

      expect(mockAggregateQueue.add).toHaveBeenCalledWith(
        'compute-aggregates',
        jobData,
        expect.any(Object)
      );
      expect(result).toBe('job-2');
    });

    it('should use correct job options with delay', async () => {
      const jobData = { importRunId: 'test-import-id' };
      mockAggregateQueue.add.mockResolvedValue({ id: 'job-2' });
      
      await service.queueAggregateComputation(jobData);

      const [, , options] = mockAggregateQueue.add.mock.calls[0];
      expect(options).toHaveProperty('attempts', 2);
      expect(options).toHaveProperty('delay', 5000);
      expect(options).toHaveProperty('backoff');
    });
  });

  describe('error handling', () => {
    it('should handle import queue errors', async () => {
      const jobData = { importRunId: 'test-import-id' };
      const error = new Error('Queue error');
      
      mockImportQueue.add.mockRejectedValue(error);

      await expect(service.queueImportProcessing(jobData)).rejects.toThrow('Queue error');
    });

    it('should handle aggregate queue errors', async () => {
      const jobData = { importRunId: 'test-import-id' };
      const error = new Error('Queue error');
      
      mockAggregateQueue.add.mockRejectedValue(error);

      await expect(service.queueAggregateComputation(jobData)).rejects.toThrow('Queue error');
    });
  });
});