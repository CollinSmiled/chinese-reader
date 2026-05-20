import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  exampleSentence!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
