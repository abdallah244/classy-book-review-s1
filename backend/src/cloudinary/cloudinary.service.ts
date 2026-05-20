import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

/**
 * ☁️ Cloudinary Service
 * Service for uploading and managing images and files on Cloudinary
 */
@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    // Verify connection
    try {
      const result = await cloudinary.api.ping();
      if (result.status === 'ok') {
        this.logger.log('☁️ Cloudinary Connected Successfully! ✅');
      }
    } catch (error) {
      this.logger.error('❌ Cloudinary Connection Failed!', error.message);
    }
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadFolder =
        folder ||
        this.configService.get<string>('CLOUDINARY_FOLDER') ||
        'classy-book';

      cloudinary.uploader
        .upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Upload image from Base64
   */
  async uploadBase64Image(
    base64String: string,
    folder?: string,
  ): Promise<UploadApiResponse> {
    const uploadFolder =
      folder ||
      this.configService.get<string>('CLOUDINARY_FOLDER') ||
      'classy-book';

    return cloudinary.uploader.upload(base64String, {
      folder: uploadFolder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
  }

  /**
   * Upload video file
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadFolder =
        folder ||
        this.configService.get<string>('CLOUDINARY_FOLDER') ||
        'classy-book';

      cloudinary.uploader
        .upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'video',
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Upload PDF or document file
   */
  async uploadDocument(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadFolder =
        folder ||
        this.configService.get<string>('CLOUDINARY_FOLDER') ||
        'classy-book';

      cloudinary.uploader
        .upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'raw',
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete file with type specification
   */
  async delete(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(publicIds: string[]): Promise<any> {
    return cloudinary.api.delete_resources(publicIds);
  }

  /**
   * Upload file from Buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
      transformation?: any;
      chunk_size?: number;
      eager?: any;
      eager_async?: boolean;
    } = {},
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadFolder =
        options.folder ||
        this.configService.get<string>('CLOUDINARY_FOLDER') ||
        'classy-book';

      cloudinary.uploader
        .upload_stream(
          {
            folder: uploadFolder,
            resource_type: options.resource_type || 'image',
            transformation: options.transformation,
            chunk_size: options.chunk_size,
            eager: options.eager,
            eager_async: options.eager_async,
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed with no result'));
            }
          },
        )
        .end(buffer);
    });
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    },
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options?.width,
          height: options?.height,
          crop: options?.crop || 'fill',
          quality: options?.quality || 'auto',
          fetch_format: options?.format || 'auto',
        },
      ],
    });
  }

  /**
   * Generate URL for image with options
   */
  generateUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto',
          fetch_format: options.format || 'auto',
        },
      ],
    });
  }

  /**
   * Generate URL for video
   */
  generateVideoUrl(
    publicId: string,
    options: { quality?: string; format?: string } = {},
  ): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        {
          quality: options.quality || 'auto',
          fetch_format: options.format || 'auto',
        },
      ],
    });
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId: string, size: number = 150): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: size,
          height: size,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }

  /**
   * Get file info
   */
  async getFileInfo(publicId: string): Promise<any> {
    return cloudinary.api.resource(publicId);
  }

  /**
   * Create folder
   */
  async createFolder(folderName: string): Promise<any> {
    return cloudinary.api.create_folder(folderName);
  }

  /**
   * Get list of files in folder
   */
  async listFilesInFolder(folderName: string): Promise<any> {
    return cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
    });
  }
}
