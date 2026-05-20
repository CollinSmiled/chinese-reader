import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReadingCollectionDto {
  @ApiProperty({
    example: 'News practice',
  })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'Short articles saved for weekday reading.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}
