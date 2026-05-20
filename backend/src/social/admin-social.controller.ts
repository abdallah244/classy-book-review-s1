import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminSocialService } from './admin-social.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../security/roles-permissions/guards/roles.guard';
import { Roles } from '../security/roles-permissions/decorators/roles.decorator';

@Controller('api/v1/admin/social')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminSocialController {
  constructor(private readonly adminSocialService: AdminSocialService) {}

  @Get('stats')
  async getStats() {
    const data = await this.adminSocialService.getSocialStats();
    return { success: true, data };
  }

  @Get('posts')
  async getAllPosts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search = '',
  ) {
    const data = await this.adminSocialService.getAllPosts(
      +page,
      +limit,
      search,
    );
    return { success: true, data };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Request() req: any) {
    const result = await this.adminSocialService.deletePostAdmin(
      id,
      req.user._id || req.user.id,
    );
    return { ...result };
  }

  @Post('posts/:id/pin')
  async togglePinPost(@Param('id') id: string) {
    const result = await this.adminSocialService.togglePinPostAdmin(id);
    return { ...result };
  }

  @Delete('posts/:postId/comments/:commentId')
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    const result = await this.adminSocialService.deleteCommentAdmin(
      postId,
      commentId,
    );
    return { ...result };
  }

  // ═══════════════════════ REPORTS ═══════════════════════

  @Get('reports')
  async getReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const data = await this.adminSocialService.getReports(
      +page,
      +limit,
      status,
    );
    return { success: true, data };
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body('action') action: 'dismissed' | 'reviewed',
    @Request() req: any,
  ) {
    const result = await this.adminSocialService.resolveReport(
      id,
      action,
      req.user._id || req.user.id,
    );
    return result;
  }

  // ═══════════════════════ PUNISHMENTS ═══════════════════════

  @Post('users/:id/ban')
  async toggleSocialBan(@Param('id') id: string, @Request() req: any) {
    return await this.adminSocialService.toggleSocialBan(
      id,
      req.user._id || req.user.id,
    );
  }
}
