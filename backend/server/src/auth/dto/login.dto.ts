import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'reader@example.com',
  })
  @IsString()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
