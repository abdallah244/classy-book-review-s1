import { Module } from '@nestjs/common';
import { SoftDeleteService } from './soft-delete.service';
import { SoftDeletePlugin } from './soft-delete.plugin';

@Module({
  providers: [SoftDeleteService, SoftDeletePlugin],
  exports: [SoftDeleteService, SoftDeletePlugin],
})
export class SoftDeleteModule {}
