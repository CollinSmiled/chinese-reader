import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingDto } from './dto/reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { ReadingsService } from './readings.service';

@ApiTags('readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Save an analyzed reading',
  })
  @ApiResponse({
    status: 201,
    description: 'Reading saved successfully.',
    type: ReadingDto,
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body() createReadingDto: CreateReadingDto,
  ): Promise<ReadingDto> {
    return this.readingsService.create(user.id, createReadingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List saved readings',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved readings returned successfully.',
    type: ReadingDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('collectionId') collectionId?: string,
  ): Promise<ReadingDto[]> {
    return this.readingsService.findAll(user.id, collectionId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a saved reading by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading returned successfully.',
    type: ReadingDto,
  })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ReadingDto> {
    return this.readingsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a saved reading',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading updated successfully.',
    type: ReadingDto,
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() payload: UpdateReadingDto,
  ): Promise<ReadingDto> {
    return this.readingsService.update(user.id, id, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove a saved reading',
  })
  @ApiResponse({
    status: 204,
    description: 'Reading removed successfully.',
  })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.readingsService.remove(user.id, id);
  }
}
