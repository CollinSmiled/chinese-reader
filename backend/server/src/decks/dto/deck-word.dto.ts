import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeckWordExampleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chinese!: string;

  @ApiProperty()
  chineseOriginal!: string;

  @ApiProperty()
  english!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  pinyin!: string | null;

  @ApiProperty()
  source!: string;
}

export class DeckWordDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  word!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  pinyin!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  meaning!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  hskLevel!: number | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  sourceReadingId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  exampleSentenceId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  exampleSentence!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: DeckWordExampleDto,
  })
  example!: DeckWordExampleDto | null;

  @ApiProperty()
  createdAt!: Date;
}
