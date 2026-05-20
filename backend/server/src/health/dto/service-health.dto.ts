import { ApiProperty } from '@nestjs/swagger';

export class ServiceHealthDto {
  @ApiProperty({
    example: 'analyzer',
  })
  service!: 'analyzer';

  @ApiProperty({
    example: 'ok',
    enum: ['ok', 'unavailable'],
  })
  status!: 'ok' | 'unavailable';
}
