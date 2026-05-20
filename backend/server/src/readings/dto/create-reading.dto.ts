import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnalysisTokenDto } from '../../analysis/dto/analysis-token.dto';

export class CreateReadingDto {
  @ApiPropertyOptional({
    example: 'My first reading',
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

  @ApiProperty({
    example: '今天我去了商店买东西。',
  })
  @IsString()
  originalText!: string;

  @ApiProperty({
    type: () => AnalysisTokenDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisTokenDto)
  analyzedContent!: AnalysisTokenDto[];

  @ApiPropertyOptional({
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHskLevel?: number;
}
