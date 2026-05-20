import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async createGroup(@Request() req: any, @Body() dto: any) {
    const group = await this.groupsService.createGroup(
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: group };
  }

  @Get()
  async getAllGroups(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search = '',
  ) {
    const data = await this.groupsService.getAllGroups(+page, +limit, search);
    return { success: true, data };
  }

  @Get('my')
  async getMyGroups(@Request() req: any) {
    const groups = await this.groupsService.getMyGroups(
      req.user._id || req.user.id,
    );
    return { success: true, data: groups };
  }

  @Get(':id')
  async getGroupDetails(@Request() req: any, @Param('id') id: string) {
    const group = await this.groupsService.getGroupDetails(
      id,
      req.user._id || req.user.id,
    );
    return { success: true, data: group };
  }

  @Post(':id/join')
  async joinGroup(@Request() req: any, @Param('id') id: string) {
    const result = await this.groupsService.joinGroup(
      id,
      req.user._id || req.user.id,
    );
    return { success: true, ...result };
  }

  @Delete(':id/leave')
  async leaveGroup(@Request() req: any, @Param('id') id: string) {
    const result = await this.groupsService.leaveGroup(
      id,
      req.user._id || req.user.id,
    );
    return result;
  }

  @Post(':id/requests/:requesterId')
  async handleJoinRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Param('requesterId') requesterId: string,
    @Body('action') action: 'approve' | 'reject',
  ) {
    const result = await this.groupsService.handleJoinRequest(
      id,
      requesterId,
      req.user._id || req.user.id,
      action,
    );
    return result;
  }

  @Get(':id/posts')
  async getGroupPosts(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.groupsService.getGroupPosts(
      id,
      req.user._id || req.user.id,
      +page,
      +limit,
    );
    return { success: true, data };
  }
}
