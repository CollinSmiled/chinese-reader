import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MoveDeckWordDto {
  @ApiProperty()
  @IsString()
  targetDeckId!: string;
}
