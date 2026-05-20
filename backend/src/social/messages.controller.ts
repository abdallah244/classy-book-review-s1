import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(@Request() req: any, @Body() dto: any) {
    const message = await this.messagesService.sendMessage(
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: message };
  }

  @Get('conversations')
  async getConversations(@Request() req: any) {
    const data = await this.messagesService.getConversations(
      req.user._id || req.user.id,
    );
    return { success: true, data };
  }

  @Get('history/:otherId')
  async getMessageHistory(
    @Request() req: any,
    @Param('otherId') otherId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const data = await this.messagesService.getMessageHistory(
      req.user._id || req.user.id,
      otherId,
      +page,
      +limit,
    );
    return { success: true, data };
  }

  @Patch('read/:senderId')
  async markAsRead(@Request() req: any, @Param('senderId') senderId: string) {
    await this.messagesService.markAsRead(
      req.user._id || req.user.id,
      senderId,
    );
    return { success: true };
  }
}
