import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/auth.interface';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  async create(@Body() body: any, @CurrentUser() user: TokenPayload) {
    const { apiKey, rawKey } = await this.apiKeyService.create({
      ...body,
      ownerId: user.sub,
      tenantId: user.tenantId,
    });

    return {
      success: true,
      data: apiKey,
      rawKey, // Shown only once
      message: 'Save the key now, you will not be able to see it again',
    };
  }

  @Get()
  async findAll(@CurrentUser() user: TokenPayload) {
    const keys = await this.apiKeyService.findByOwner(user.sub);
    return { success: true, data: keys };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const apiKey = await this.apiKeyService.update(id, body);
    return { success: true, data: apiKey };
  }

  @Delete(':id')
  async revoke(@Param('id') id: string, @Body('reason') reason?: string) {
    await this.apiKeyService.revoke(id, reason);
    return { success: true, message: 'API key revoked successfully' };
  }

  @Post(':id/regenerate')
  async regenerate(@Param('id') id: string) {
    const { apiKey, rawKey } = await this.apiKeyService.regenerate(id);
    return {
      success: true,
      data: apiKey,
      rawKey,
      message: 'Key regenerated. Save it now',
    };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: TokenPayload) {
    const stats = await this.apiKeyService.getStats(user.sub);
    return { success: true, data: stats };
  }
}
