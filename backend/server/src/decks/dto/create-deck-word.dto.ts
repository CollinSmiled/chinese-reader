import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDeckWordDto {
  @ApiProperty({
    example: '商店',
  })
  @IsString()
  @MaxLength(100)
  word!: string;

  @ApiPropertyOptional({
    example: 'shang dian',
  })
  @IsOptional()
  @IsString()
  pinyin?: string;

  @ApiPropertyOptional({
    example: 'store; shop',
  })
  @IsOptional()
  @IsString()
  meaning?: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  hskLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceReadingId?: string;

  @ApiPropertyOptional({
    example: '今天我去了商店买东西。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  exampleSentence?: string;
}
