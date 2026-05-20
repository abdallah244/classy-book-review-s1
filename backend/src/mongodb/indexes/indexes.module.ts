import { Module, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IndexManagerService } from './index-manager.service';

@Module({
  providers: [IndexManagerService],
  exports: [IndexManagerService],
})
export class IndexesModule implements OnModuleInit {
  constructor(
    @InjectConnection() private connection: Connection,
    private indexManager: IndexManagerService,
  ) {}

  async onModuleInit() {
    // Create indexes on app start
    await this.indexManager.ensureIndexes();
  }
}
