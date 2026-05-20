import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionService {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Execute operation within Transaction
   */
  async withTransaction<T>(
    callback: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const result = await callback(session);

      await session.commitTransaction();

      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Start new Session (for manual use)
   */
  async startSession(): Promise<ClientSession> {
    return this.connection.startSession();
  }

  /**
   * Execute multiple operations sequentially
   */
  async executeInSequence<T>(
    operations: ((session: ClientSession) => Promise<any>)[],
  ): Promise<T[]> {
    return this.withTransaction(async (session) => {
      const results: T[] = [];

      for (const operation of operations) {
        const result = await operation(session);
        results.push(result);
      }

      return results;
    });
  }

  /**
   * Execute multiple operations in parallel (with guaranteed rollback for all)
   */
  async executeInParallel<T>(
    operations: ((session: ClientSession) => Promise<any>)[],
  ): Promise<T[]> {
    return this.withTransaction(async (session) => {
      return Promise.all(operations.map((op) => op(session)));
    });
  }
}
