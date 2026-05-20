import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateReadingCollectionDto } from './dto/create-reading-collection.dto';
import { ReadingCollectionDto } from './dto/reading-collection.dto';
import { UpdateReadingCollectionDto } from './dto/update-reading-collection.dto';
import { ReadingCollectionsService } from './reading-collections.service';

@ApiTags('reading collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reading-collections')
export class ReadingCollectionsController {
  constructor(private readonly collectionsService: ReadingCollectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List reading collections',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading collections returned successfully.',
    type: ReadingCollectionDto,
    isArray: true,
  })
  findAll(@CurrentUser() user: AuthUser): Promise<ReadingCollectionDto[]> {
    return this.collectionsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a reading collection',
  })
  @ApiResponse({
    status: 201,
    description: 'Reading collection created successfully.',
    type: ReadingCollectionDto,
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body() payload: CreateReadingCollectionDto,
  ): Promise<ReadingCollectionDto> {
    return this.collectionsService.create(user.id, payload);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a reading collection',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading collection updated successfully.',
    type: ReadingCollectionDto,
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() payload: UpdateReadingCollectionDto,
  ): Promise<ReadingCollectionDto> {
    return this.collectionsService.update(user.id, id, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a reading collection',
  })
  @ApiResponse({
    status: 204,
    description: 'Reading collection deleted successfully.',
  })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.collectionsService.remove(user.id, id);
  }
}
