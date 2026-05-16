import { IsOptional, IsString, IsEnum } from 'class-validator';

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
}
