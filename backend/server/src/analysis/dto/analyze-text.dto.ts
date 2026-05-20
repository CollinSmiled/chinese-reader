import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnalyzeTextDto {
  @ApiProperty({
    example: '今天我去了商店买东西。',
    description: 'Chinese text to analyze.',
    maxLength: 20000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  text!: string;
}
