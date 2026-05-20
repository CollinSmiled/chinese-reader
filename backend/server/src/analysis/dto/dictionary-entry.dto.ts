import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DictionaryEntryDto {
  @ApiProperty({
    example: 'jintian',
  })
  @IsString()
  pinyin!: string;

  @ApiProperty({
    example: 'today',
  })
  @IsString()
  english!: string;
}
