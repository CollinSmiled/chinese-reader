import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeckDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'Saved Words',
  })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({
    example: 12,
  })
  wordCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
