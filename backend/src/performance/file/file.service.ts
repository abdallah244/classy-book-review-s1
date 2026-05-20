import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import sharp from 'sharp';
import * as path from 'path';

export interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any;
  allowedFormats?: string[];
  maxSizeBytes?: number;
}

export interface ProcessedFile {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  thumbnailUrl?: string;
}

@Injectable()
export class FileService {
  private readonly maxImageSize: number;
  private readonly maxVideoSize: number;
  private readonly maxDocSize: number;

  constructor(
    private cloudinaryService: CloudinaryService,
    private configService: ConfigService,
  ) {
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.maxVideoSize = 500 * 1024 * 1024; // 500MB
    this.maxDocSize = 20 * 1024 * 1024; // 20MB
  }

  /**
   * Upload image with optimization
   */
  async uploadImage(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<ProcessedFile> {
    this.validateFile(file, {
      allowedFormats: options.allowedFormats || [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
      ],
      maxSizeBytes: options.maxSizeBytes || this.maxImageSize,
    });

    // Optimize image before upload
    const optimizedBuffer = await this.optimizeImage(file.buffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    // Upload image
    const result = await this.cloudinaryService.uploadBuffer(optimizedBuffer, {
      folder: options.folder || 'images',
      resource_type: 'image',
      transformation: options.transformation || [
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
      ],
    });

    // Create thumbnail
    const thumbnailResult = await this.cloudinaryService.uploadBuffer(
      optimizedBuffer,
      {
        folder: `${options.folder || 'images'}/thumbnails`,
        resource_type: 'image',
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto:low' },
        ],
      },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      thumbnailUrl: thumbnailResult.secure_url,
    };
  }

  /**
   * Upload video
   */
  async uploadVideo(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<ProcessedFile> {
    this.validateFile(file, {
      allowedFormats: options.allowedFormats || ['mp4', 'webm', 'mov', 'avi'],
      maxSizeBytes: options.maxSizeBytes || this.maxVideoSize,
    });

    const result = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: options.folder || 'videos',
      resource_type: 'video',
      chunk_size: 6000000, // 6MB chunks
      eager: [
        { streaming_profile: 'full_hd', format: 'hls' }, // HLS for streaming
        { width: 1280, height: 720, crop: 'limit', format: 'mp4' }, // 720p backup
      ],
      eager_async: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      thumbnailUrl: result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
    };
  }

  /**
   * Upload document
   */
  async uploadDocument(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<ProcessedFile> {
    this.validateFile(file, {
      allowedFormats: options.allowedFormats || [
        'pdf',
        'doc',
        'docx',
        'ppt',
        'pptx',
        'xls',
        'xlsx',
      ],
      maxSizeBytes: options.maxSizeBytes || this.maxDocSize,
    });

    const result = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: options.folder || 'documents',
      resource_type: 'raw',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: path.extname(file.originalname).slice(1),
      bytes: result.bytes,
    };
  }

  /**
   * Delete file
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<void> {
    await this.cloudinaryService.delete(publicId, resourceType);
  }

  /**
   * Optimize image
   */
  private async optimizeImage(
    buffer: Buffer,
    options: { maxWidth: number; maxHeight: number; quality: number },
  ): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    let pipeline = image;

    // Resize if larger than maximum
    if (metadata.width && metadata.width > options.maxWidth) {
      pipeline = pipeline.resize(options.maxWidth, undefined, {
        withoutEnlargement: true,
      });
    }
    if (metadata.height && metadata.height > options.maxHeight) {
      pipeline = pipeline.resize(undefined, options.maxHeight, {
        withoutEnlargement: true,
      });
    }

    // Convert to WebP for better compression
    return pipeline.webp({ quality: options.quality }).toBuffer();
  }

  /**
   * Validate file
   */
  private validateFile(
    file: Express.Multer.File,
    options: { allowedFormats: string[]; maxSizeBytes: number },
  ): void {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    // Check size
    if (file.size > options.maxSizeBytes) {
      const maxSizeMB = (options.maxSizeBytes / 1024 / 1024).toFixed(1);
      throw new BadRequestException(
        `File size exceeds maximum limit (${maxSizeMB}MB)`,
      );
    }

    // Check type
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!options.allowedFormats.includes(ext)) {
      throw new BadRequestException(
        `File type not supported. Allowed types: ${options.allowedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Generate URL for image with transformations
   */
  generateImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return this.cloudinaryService.generateUrl(publicId, options);
  }

  /**
   * Generate URL for video
   */
  generateVideoUrl(
    publicId: string,
    options: { quality?: string; format?: string } = {},
  ): string {
    return this.cloudinaryService.generateVideoUrl(publicId, options);
  }
}
