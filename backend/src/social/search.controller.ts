import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string, @Query('limit') limit = 5) {
    const data = await this.searchService.globalSearch(query, +limit);
    return { success: true, data };
  }
}
