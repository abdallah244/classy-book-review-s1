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
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  findAllPermissions() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.rolesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() body: { add?: string[]; remove?: string[] },
  ) {
    if (body.add?.length) {
      return this.rolesService.addPermissions(id, body.add);
    }
    if (body.remove?.length) {
      return this.rolesService.removePermissions(id, body.remove);
    }
    return this.rolesService.findById(id);
  }

  @Post('seed')
  async seed() {
    await this.rolesService.seedDefaultRoles();
    await this.permissionsService.seedDefaultPermissions();
    return { success: true, message: 'Default roles and permissions created' };
  }
}
