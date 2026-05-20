import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DictionaryResultDto {
  @ApiProperty({
    example: '商店',
  })
  word!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '商店',
  })
  traditional!: string | null;

  @ApiProperty({
    example: 'shang1 dian4',
  })
  pinyin!: string;

  @ApiProperty({
    example: ['store', 'shop'],
    isArray: true,
  })
  definitions!: string[];

  @ApiPropertyOptional({
    nullable: true,
    example: 2,
  })
  hskLevel!: number | null;
}
