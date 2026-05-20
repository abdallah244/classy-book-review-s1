import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles-permissions/guards/roles.guard';
import { Roles } from '../roles-permissions/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'super_admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  remove(@Param('id') id: string, @CurrentUser('sub') currentUserId: string) {
    return this.usersService.softDelete(id, currentUserId);
  }

  @Patch(':id/restore')
  @Roles('admin', 'super_admin')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Patch(':id/role')
  @Roles('super_admin')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/permissions')
  @Roles('super_admin')
  updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.usersService.updatePermissions(id, permissions);
  }

  @Patch(':id/toggle-active')
  @Roles('admin', 'super_admin')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
