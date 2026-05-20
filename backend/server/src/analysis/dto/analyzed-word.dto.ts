import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DictionaryEntryDto } from './dictionary-entry.dto';

export class AnalyzedWordDto {
  @ApiProperty({
    example: 'today',
  })
  @IsString()
  word!: string;

  @ApiProperty({
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  hsk_level!: number | null;

  @ApiProperty({
    type: () => DictionaryEntryDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryEntryDto)
  dictionary!: DictionaryEntryDto[];

  @ApiPropertyOptional({
    example: 'jintian',
  })
  @IsOptional()
  @IsString()
  generated_pinyin?: string;
}
