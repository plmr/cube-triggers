import { registerEnumType } from '@nestjs/graphql';
// Import Prisma's generated enums
import {
  AlgType as PrismaAlgType,
  ImportStatus as PrismaImportStatus,
} from '@prisma/client';

/**
 * Use Prisma's generated enums and register them with GraphQL
 * This ensures type compatibility between Prisma and GraphQL
 */
export const AlgType = PrismaAlgType;
export const ImportStatus = PrismaImportStatus;

// Type aliases for convenience
export type AlgType = PrismaAlgType;
export type ImportStatus = PrismaImportStatus;

// Register enums with GraphQL
registerEnumType(AlgType, {
  name: 'AlgType',
  description: 'Types of speedcubing algorithms',
});

registerEnumType(ImportStatus, {
  name: 'ImportStatus',
  description: 'Status of algorithm import runs',
});
