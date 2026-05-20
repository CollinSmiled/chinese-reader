import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnalysisTokenDto } from '../../analysis/dto/analysis-token.dto';

export class UpdateReadingDto {
  @ApiPropertyOptional({
    example: 'Chapter 1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: '7a6d7ee8-5d52-43a8-a48b-9948bce7fc2f',
  })
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @ApiPropertyOptional({
    example: '今天我去了商店买东西。',
  })
  @IsOptional()
  @IsString()
  originalText?: string;

  @ApiPropertyOptional({
    type: () => AnalysisTokenDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisTokenDto)
  analyzedContent?: AnalysisTokenDto[];

  @ApiPropertyOptional({
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHskLevel?: number;
}
