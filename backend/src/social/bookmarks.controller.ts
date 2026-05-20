import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId')
  async toggleBookmark(@Request() req: any, @Param('postId') postId: string) {
    const result = await this.bookmarksService.toggleBookmark(
      req.user._id || req.user.id,
      postId,
    );
    return { success: true, ...result };
  }

  @Get()
  async getMyBookmarks(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.bookmarksService.getMyBookmarks(
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data };
  }
}
