import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';

@Controller('api/v1/social/partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  async createPage(@Request() req: any, @Body() dto: any) {
    const page = await this.partnersService.createPage(
      req.user._id || req.user.id,
      dto,
    );
    return { success: true, data: page };
  }

  @Get()
  async getAllPages(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search = '',
    @Query('category') category = '',
  ) {
    const data = await this.partnersService.getAllPages(
      +page,
      +limit,
      search,
      category,
    );
    return { success: true, data };
  }

  @Get('my')
  async getMyPages(@Request() req: any) {
    const pages = await this.partnersService.getMyPages(
      req.user._id || req.user.id,
    );
    return { success: true, data: pages };
  }

  @Get(':idOrUsername')
  async getPageDetails(
    @Request() req: any,
    @Param('idOrUsername') idOrUsername: string,
  ) {
    const page = await this.partnersService.getPageDetails(
      idOrUsername,
      req.user._id || req.user.id,
    );
    return { success: true, data: page };
  }

  @Post(':id/follow')
  async followPage(@Request() req: any, @Param('id') id: string) {
    const result = await this.partnersService.followPage(
      id,
      req.user._id || req.user.id,
    );
    return result;
  }
}
