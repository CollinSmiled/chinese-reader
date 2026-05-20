import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadingCollectionDto {
  @ApiProperty({
    example: '7a6d7ee8-5d52-43a8-a48b-9948bce7fc2f',
  })
  id!: string;

  @ApiProperty({
    example: 'News practice',
  })
  name!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: false,
  })
  isDefault!: boolean;

  @ApiProperty({
    example: 12,
  })
  readingCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
