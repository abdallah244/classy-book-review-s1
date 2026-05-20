import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface IndexDefinition {
  collection: string;
  indexes: {
    fields: Record<string, 1 | -1 | 'text' | '2dsphere'>;
    options?: {
      unique?: boolean;
      sparse?: boolean;
      expireAfterSeconds?: number;
      partialFilterExpression?: Record<string, any>;
      weights?: Record<string, number>;
      default_language?: string;
    };
  }[];
}

@Injectable()
export class IndexManagerService {
  private readonly logger = new Logger(IndexManagerService.name);

  // Define indexes for each collection
  private readonly indexDefinitions: IndexDefinition[] = [
    {
      collection: 'users',
      indexes: [
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { role: 1, isActive: 1 } },
        { fields: { tenantId: 1, isDeleted: 1 } },
        { fields: { createdAt: -1 } },
        {
          fields: { name: 'text', email: 'text' },
          options: {
            weights: { name: 10, email: 5 },
            default_language: 'none',
          },
        },
      ],
    },
    {
      collection: 'courses',
      indexes: [
        { fields: { slug: 1 }, options: { unique: true } },
        { fields: { teacherId: 1, status: 1 } },
        { fields: { categoryId: 1, status: 1 } },
        { fields: { 'pricing.price': 1 } },
        { fields: { createdAt: -1 } },
        { fields: { isDeleted: 1, status: 1 } },
        {
          fields: { title: 'text', description: 'text' },
          options: {
            weights: { title: 10, description: 5 },
            default_language: 'none',
          },
        },
      ],
    },
    {
      collection: 'lessons',
      indexes: [
        { fields: { courseId: 1, order: 1 } },
        { fields: { sectionId: 1, order: 1 } },
        { fields: { isPublished: 1 } },
      ],
    },
    {
      collection: 'enrollments',
      indexes: [
        { fields: { userId: 1, courseId: 1 }, options: { unique: true } },
        { fields: { userId: 1, status: 1 } },
        { fields: { courseId: 1, status: 1 } },
        { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
      ],
    },
    {
      collection: 'progress',
      indexes: [
        { fields: { userId: 1, lessonId: 1 }, options: { unique: true } },
        { fields: { userId: 1, courseId: 1 } },
      ],
    },
    {
      collection: 'payments',
      indexes: [
        { fields: { userId: 1, createdAt: -1 } },
        { fields: { orderId: 1 } },
        { fields: { status: 1, createdAt: -1 } },
        { fields: { gatewayTransactionId: 1 } },
      ],
    },
    {
      collection: 'sessions',
      indexes: [
        { fields: { userId: 1, isActive: 1 } },
        { fields: { sessionId: 1 }, options: { unique: true } },
        { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
      ],
    },
    {
      collection: 'refresh_tokens',
      indexes: [
        { fields: { userId: 1 } },
        { fields: { userId: 1, isRevoked: 1 } },
        { fields: { isRevoked: 1, sessionExpiresAt: 1, createdAt: -1 } },
        { fields: { token: 1 } },
        { fields: { tokenHash: 1, isRevoked: 1, expiresAt: 1 } },
        { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
      ],
    },
    {
      collection: 'audit_logs',
      indexes: [
        { fields: { userId: 1, createdAt: -1 } },
        { fields: { action: 1, createdAt: -1 } },
        { fields: { resource: 1, resourceId: 1 } },
        {
          fields: { createdAt: 1 },
          options: { expireAfterSeconds: 365 * 24 * 60 * 60 },
        },
      ],
    },
    {
      collection: 'notifications',
      indexes: [
        { fields: { userId: 1, isRead: 1, createdAt: -1 } },
        {
          fields: { createdAt: 1 },
          options: { expireAfterSeconds: 90 * 24 * 60 * 60 },
        },
      ],
    },
  ];

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Create all indexes
   */
  async ensureIndexes(): Promise<void> {
    this.logger.log('Starting index creation...');

    for (const definition of this.indexDefinitions) {
      try {
        await this.ensureCollectionIndexes(definition);
      } catch (error) {
        this.logger.error(
          `Error creating indexes for ${definition.collection}:`,
          error,
        );
      }
    }

    this.logger.log('Finished creating indexes');
  }

  /**
   * Create indexes for specific collection
   */
  private async ensureCollectionIndexes(
    definition: IndexDefinition,
  ): Promise<void> {
    const collection = this.connection.collection(definition.collection);

    for (const index of definition.indexes) {
      try {
        await collection.createIndex(index.fields, index.options || {});
        this.logger.debug(
          `Created index on ${definition.collection}: ${JSON.stringify(index.fields)}`,
        );
      } catch (error: any) {
        // Ignore error for existing index
        if (error.code !== 85 && error.code !== 86) {
          throw error;
        }
      }
    }
  }

  /**
   * Delete specific index
   */
  async dropIndex(collection: string, indexName: string): Promise<void> {
    await this.connection.collection(collection).dropIndex(indexName);
    this.logger.log(`Deleted index ${indexName} from ${collection}`);
  }

  /**
   * List indexes for collection
   */
  async listIndexes(collection: string): Promise<any[]> {
    return this.connection.collection(collection).listIndexes().toArray();
  }

  /**
   * Analyze index usage
   */
  async analyzeIndexUsage(collection: string): Promise<any> {
    const db = this.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const stats = await db.command({
      aggregate: collection,
      pipeline: [{ $indexStats: {} }],
      cursor: {},
    });

    return stats.cursor?.firstBatch || [];
  }

  /**
   * Rebuild indexes for collection
   */
  async reIndex(collection: string): Promise<void> {
    const db = this.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    await db.command({ reIndex: collection });
    this.logger.log(`Rebuilt indexes for ${collection}`);
  }
}
