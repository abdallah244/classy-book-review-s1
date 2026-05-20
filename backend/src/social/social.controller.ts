import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SocialService } from './social.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto } from './dto';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ═══════════════════════ POSTS ═══════════════════════

  @Post('posts')
  async createPost(@Request() req: any, @Body() dto: CreatePostDto) {
    const post = await this.socialService.createPost(
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: post };
  }

  @Post('posts/:id/repost')
  async repost(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content?: string,
  ) {
    const post = await this.socialService.repost(
      req.user._id || req.user.id,
      id,
      content,
    );
    return { success: true, data: post };
  }

  @Get('feed')
  async getFeed(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.getFeed(
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data: result };
  }

  @Get('posts/:id')
  async getPost(@Request() req: any, @Param('id') id: string) {
    const post = await this.socialService.getPostById(
      id,
      req.user._id || req.user.id,
    );
    return { success: true, data: post };
  }

  @Put('posts/:id')
  async updatePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    const post = await this.socialService.updatePost(
      id,
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: post };
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.OK)
  async deletePost(@Request() req: any, @Param('id') id: string) {
    await this.socialService.deletePost(id, req.user._id || req.user.id);
    return { success: true, message: 'Post deleted' };
  }

  // ═══════════════════════ LIKES ═══════════════════════

  @Post('posts/:id/react')
  async toggleReaction(
    @Request() req: any,
    @Param('id') id: string,
    @Body('type') type: string,
  ) {
    const result = await this.socialService.toggleReaction(
      req.user._id || req.user.id,
      id,
      type,
    );
    return { success: true, data: result };
  }

  // ═══════════════════════ COMMENTS ═══════════════════════

  @Post('posts/:id/comments')
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    const post = await this.socialService.addComment(
      id,
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: post };
  }

  @Delete('posts/:postId/comments/:commentId')
  async deleteComment(
    @Request() req: any,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    const post = await this.socialService.deleteComment(
      postId,
      commentId,
      req.user._id || req.user.id,
    );
    return { success: true, data: post };
  }

  // ═══════════════════════ FOLLOWS ═══════════════════════

  @Post('follow/:userId')
  async toggleFollow(@Request() req: any, @Param('userId') userId: string) {
    const result = await this.socialService.toggleFollow(
      req.user._id || req.user.id,
      userId,
    );
    return { success: true, data: result };
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.getFollowers(userId, +page, +limit);
    return { success: true, data: result };
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.getFollowing(userId, +page, +limit);
    return { success: true, data: result };
  }

  // ═══════════════════════ USER PROFILE ═══════════════════════

  @Get('user/:userId/posts')
  async getUserPosts(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.getUserPosts(
      userId,
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data: result };
  }

  @Get('user/:userId/profile')
  async getUserProfile(@Request() req: any, @Param('userId') userId: string) {
    const result = await this.socialService.getUserProfile(
      userId,
      req.user._id || req.user.id,
    );
    return { success: true, data: result };
  }

  // ═══════════════════════ NOTIFICATIONS ═══════════════════════

  @Get('notifications')
  async getNotifications(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.getNotifications(
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data: result };
  }

  @Post('notifications/read-all')
  async markAllRead(@Request() req: any) {
    await this.socialService.markNotificationsRead(req.user._id || req.user.id);
    return { success: true, message: 'All notifications marked as read' };
  }

  @Post('notifications/:id/read')
  async markRead(@Request() req: any, @Param('id') id: string) {
    await this.socialService.markNotificationRead(
      id,
      req.user._id || req.user.id,
    );
    return { success: true };
  }

  // ═══════════════════════ SEARCH & TRENDING ═══════════════════════

  @Get('search')
  async search(
    @Request() req: any,
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.socialService.searchPosts(
      query,
      +page,
      +limit,
      req.user._id || req.user.id,
    );
    return { success: true, data: result };
  }

  @Get('trending')
  async getTrending() {
    const hashtags = await this.socialService.getTrendingHashtags();
    return { success: true, data: hashtags };
  }

  @Get('suggested-users')
  async getSuggestedUsers(@Request() req: any) {
    const users = await this.socialService.getSuggestedUsers(
      req.user._id || req.user.id,
    );
    return { success: true, data: users };
  }

  // ═══════════════════════ REPORTING ═══════════════════════

  @Post('posts/:id/report')
  async reportPost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string; details?: string },
  ) {
    await this.socialService.reportPost(
      req.user._id || req.user.id,
      id,
      body.reason,
      body.details,
    );
    return { success: true, message: 'Report submitted successfully' };
  }

  // ═══════════════════════ MEDIA ═══════════════════════

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
    const urls = await this.socialService.uploadFiles(files);
    return { success: true, urls };
  }
}
