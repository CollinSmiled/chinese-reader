import { ApiProperty } from '@nestjs/swagger';

export class ExampleSentenceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chinese!: string;

  @ApiProperty()
  chineseOriginal!: string;

  @ApiProperty()
  english!: string;

  @ApiProperty({
    nullable: true,
  })
  pinyin!: string | null;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  sourceSentenceId!: string;

  @ApiProperty()
  translationSentenceId!: string;

  @ApiProperty()
  charCount!: number;

  @ApiProperty()
  wordCount!: number;

  @ApiProperty({
    nullable: true,
  })
  estimatedHskLevel!: number | null;
}
