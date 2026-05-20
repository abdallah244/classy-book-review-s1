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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../security/roles-permissions/guards/roles.guard';
import { Roles } from '../security/roles-permissions/decorators/roles.decorator';
import { CurrentUser } from '../security/auth/decorators/current-user.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ═══ PUBLIC ═══

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll({
      page,
      limit,
      status: status || 'published',
      category,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  // ═══ AUTHENTICATED ═══

  @UseGuards(JwtAuthGuard)
  @Post(':id/enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.enroll(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/enrollments')
  async myEnrollments(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coursesService.getMyEnrollments(user.sub, {
      status,
      page,
      limit,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':courseId/progress/:lessonId')
  async updateProgress(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.coursesService.updateProgress(user.sub, courseId, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/stats')
  async myStats(@CurrentUser() user: any) {
    return this.coursesService.getUserStats(user.sub);
  }

  // ═══ ADMIN ═══

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.coursesService.create(body, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'teacher')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, body, user.sub, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.coursesService.remove(id, user.sub, user.role);
    return { message: 'Course deleted' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Get('admin/stats')
  async adminStats() {
    return this.coursesService.getAdminStats();
  }
}
