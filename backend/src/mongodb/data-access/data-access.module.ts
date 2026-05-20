import { Module } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { QueryBuilderService } from './query-builder.service';
import { TransactionService } from './transaction.service';

@Module({
  providers: [QueryBuilderService, TransactionService],
  exports: [QueryBuilderService, TransactionService],
})
export class DataAccessModule {}
