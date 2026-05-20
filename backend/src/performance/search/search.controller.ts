import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../security/auth/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  // This Controller will be customized for each entity
  @Get()
  async search(@Query() query: any) {
    return {
      message: 'Use search endpoints specific to each entity',
      example: '/courses/search, /lessons/search, /users/search',
    };
  }
}
