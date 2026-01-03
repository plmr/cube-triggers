import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';

// Import Prisma service
import { PrismaService } from './prisma';
// Import all resolvers
import { SourceResolver } from './resolvers/source.resolver';
import { NgramResolver } from './resolvers/ngram.resolver';
import { ImportResolver } from './resolvers/import.resolver';
// Import services
import { AlgorithmParserService, JobQueueService } from './services';
// Import job processors
import { ImportProcessor } from './jobs/processors/import-processor';
import { AggregateProcessor } from './jobs/processors/aggregate-processor';
import { JOB_QUEUES } from './jobs/types';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // BullMQ setup
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: 'localhost',
          port: 6379,
          // Add Redis connection options if needed
        },
      }),
    }),

    // Register job queues
    BullModule.registerQueue(
      { name: JOB_QUEUES.IMPORT_PROCESSING },
      { name: JOB_QUEUES.AGGREGATE_COMPUTATION },
    ),

    // GraphQL setup with code-first approach
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code-first: generate schema from TypeScript decorators
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Enable GraphQL Playground for development
      playground: true,
      // Enable introspection (needed for Playground)
      introspection: true,
      // Sort schema fields alphabetically for consistency
      sortSchema: true,
    }),
  ],
  providers: [
    // Register Prisma service
    PrismaService,
    // Register services
    AlgorithmParserService,
    JobQueueService,
    // Register job processors
    ImportProcessor,
    AggregateProcessor,
    // Register GraphQL resolvers
    SourceResolver,
    NgramResolver,
    ImportResolver,
  ],
})
export class AppModule {}
