import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DictionaryEntryDto } from './dictionary-entry.dto';

export class AnalysisTokenDto {
  @ApiProperty({
    enum: ['word', 'text'],
  })
  @IsIn(['word', 'text'])
  type!: 'word' | 'text';

  @ApiPropertyOptional({
    example: 'today',
  })
  @IsOptional()
  @IsString()
  word?: string;

  @ApiPropertyOptional({
    example: '。',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  hsk_level?: number | null;

  @ApiPropertyOptional({
    type: () => DictionaryEntryDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryEntryDto)
  dictionary?: DictionaryEntryDto[];

  @ApiPropertyOptional({
    example: 'jintian',
  })
  @IsOptional()
  @IsString()
  generated_pinyin?: string;
}
