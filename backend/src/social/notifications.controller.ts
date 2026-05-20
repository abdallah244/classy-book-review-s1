import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.notificationsService.getNotifications(
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data };
  }

  @Patch('read')
  async markAllAsRead(@Request() req: any) {
    await this.notificationsService.markAsRead(req.user._id || req.user.id);
    return { success: true };
  }

  @Patch('read/:id')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    await this.notificationsService.markAsRead(req.user._id || req.user.id, id);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(@Request() req: any, @Param('id') id: string) {
    await this.notificationsService.deleteNotification(
      req.user._id || req.user.id,
      id,
    );
    return { success: true };
  }
}
