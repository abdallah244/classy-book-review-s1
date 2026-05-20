import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService, ProcessedFile } from './file.service';
import { JwtAuthGuard } from '../../security/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../security/auth/decorators/current-user.decorator';
import type { TokenPayload } from '../../security/auth/interfaces/auth.interface';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @CurrentUser() user?: TokenPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.fileService.uploadImage(file, {
      folder: folder || `users/${user?.sub}/images`,
    });

    return { success: true, data: result };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @CurrentUser() user?: TokenPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.fileService.uploadVideo(file, {
      folder: folder || `users/${user?.sub}/videos`,
    });

    return { success: true, data: result };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @CurrentUser() user?: TokenPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.fileService.uploadDocument(file, {
      folder: folder || `users/${user?.sub}/documents`,
    });

    return { success: true, data: result };
  }

  @Delete(':publicId')
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query('type') type: 'image' | 'video' | 'raw' = 'image',
  ) {
    await this.fileService.deleteFile(publicId, type);
    return { success: true, message: 'File deleted successfully' };
  }
}
