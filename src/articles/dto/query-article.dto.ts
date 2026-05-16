import { IsOptional, IsString } from 'class-validator';

export class QueryArticleDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
