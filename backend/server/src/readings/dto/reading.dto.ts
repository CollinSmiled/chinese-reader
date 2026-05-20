import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisTokenDto } from '../../analysis/dto/analysis-token.dto';

export class ReadingDto {
  @ApiProperty({
    example: '7a6d7ee8-5d52-43a8-a48b-9948bce7fc2f',
  })
  id!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  userId!: string | null;

  @ApiPropertyOptional({
    example: 'My first reading',
    nullable: true,
  })
  title!: string | null;

  @ApiPropertyOptional({
    example: '7a6d7ee8-5d52-43a8-a48b-9948bce7fc2f',
    nullable: true,
  })
  collectionId!: string | null;

  @ApiPropertyOptional({
    example: 'Saved Readings',
    nullable: true,
  })
  collectionName!: string | null;

  @ApiProperty({
    example: '今天我去了商店买东西。',
  })
  originalText!: string;

  @ApiProperty({
    type: () => AnalysisTokenDto,
    isArray: true,
  })
  analyzedContent!: AnalysisTokenDto[];

  @ApiProperty({
    example: 6,
  })
  wordCount!: number;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
  })
  estimatedHskLevel!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
