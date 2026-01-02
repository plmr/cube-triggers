import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service
 * 
 * @Injectable() makes this class available for dependency injection
 * OnModuleInit ensures we connect to the database when the module starts
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  
  constructor() {
    // Call parent constructor with empty options (required for Prisma v7)
    super({});
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit() {
    await this.$connect();
    console.log('Connected to PostgreSQL database');
  }

  /**
   * Gracefully disconnect when the application shuts down
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Disconnected from PostgreSQL database');
  }
}