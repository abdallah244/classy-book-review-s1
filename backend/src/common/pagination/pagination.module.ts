import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination.service';

/**
 * 📄 Pagination Module
 * Data pagination module
 */
@Global()
@Module({
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
