import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  async createStory(@Request() req: any, @Body() dto: any) {
    const story = await this.storiesService.createStory(
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: story };
  }

  @Get('feed')
  async getFeedStories(@Request() req: any) {
    const data = await this.storiesService.getFeedStories(
      req.user._id || req.user.id,
    );
    return { success: true, data };
  }

  @Post(':id/view')
  async viewStory(@Request() req: any, @Param('id') id: string) {
    await this.storiesService.viewStory(req.user._id || req.user.id, id);
    return { success: true };
  }

  @Delete(':id')
  async deleteStory(@Request() req: any, @Param('id') id: string) {
    await this.storiesService.deleteStory(req.user._id || req.user.id, id);
    return { success: true, message: 'Story deleted' };
  }
}
