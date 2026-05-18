import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ArticleStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class QueryArticleDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(ArticleStatusFilter)
  @IsOptional()
  status?: ArticleStatusFilter;

  @IsOptional()
  @Type(() => Number)
  locationId?: number;
}
