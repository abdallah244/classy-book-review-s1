import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];

  @IsOptional()
  @IsEnum(['text', 'image', 'video', 'link', 'poll'])
  type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  visibility?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  visibility?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class PaginationQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
