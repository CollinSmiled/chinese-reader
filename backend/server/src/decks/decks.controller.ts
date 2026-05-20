import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { CreateDeckWordDto } from './dto/create-deck-word.dto';
import { DeckDto } from './dto/deck.dto';
import { DeckWordDto } from './dto/deck-word.dto';
import { MoveDeckWordDto } from './dto/move-deck-word.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@ApiTags('decks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  @ApiOperation({
    summary: 'List the current user decks',
  })
  @ApiResponse({
    status: 200,
    description: 'Decks returned successfully.',
    type: DeckDto,
    isArray: true,
  })
  findAll(@CurrentUser() user: AuthUser): Promise<DeckDto[]> {
    return this.decksService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a vocabulary deck',
  })
  @ApiResponse({
    status: 201,
    description: 'Deck created successfully.',
    type: DeckDto,
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body() payload: CreateDeckDto,
  ): Promise<DeckDto> {
    return this.decksService.create(user.id, payload);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a vocabulary deck',
  })
  @ApiResponse({
    status: 200,
    description: 'Deck updated successfully.',
    type: DeckDto,
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() payload: UpdateDeckDto,
  ): Promise<DeckDto> {
    return this.decksService.update(user.id, id, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a vocabulary deck',
  })
  @ApiResponse({
    status: 204,
    description: 'Deck deleted successfully.',
  })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.decksService.remove(user.id, id);
  }

  @Get(':id/words')
  @ApiOperation({
    summary: 'List words in a deck',
  })
  @ApiResponse({
    status: 200,
    description: 'Deck words returned successfully.',
    type: DeckWordDto,
    isArray: true,
  })
  findWords(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<DeckWordDto[]> {
    return this.decksService.findWords(user.id, id);
  }

  @Post(':id/words')
  @ApiOperation({
    summary: 'Add a vocabulary word to a deck',
  })
  @ApiResponse({
    status: 201,
    description: 'Word added to deck successfully.',
    type: DeckWordDto,
  })
  addWord(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() payload: CreateDeckWordDto,
  ): Promise<DeckWordDto> {
    return this.decksService.addWord(user.id, id, payload);
  }

  @Patch(':id/words/:wordId/move')
  @ApiOperation({
    summary: 'Move a vocabulary word to another deck',
  })
  @ApiResponse({
    status: 200,
    description: 'Word moved successfully.',
    type: DeckWordDto,
  })
  moveWord(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('wordId') wordId: string,
    @Body() payload: MoveDeckWordDto,
  ): Promise<DeckWordDto> {
    return this.decksService.moveWord(user.id, id, wordId, payload.targetDeckId);
  }

  @Delete(':id/words/:wordId')
  @ApiOperation({
    summary: 'Remove a vocabulary word from a deck',
  })
  @ApiResponse({
    status: 204,
    description: 'Word removed from deck successfully.',
  })
  @HttpCode(204)
  removeWord(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('wordId') wordId: string,
  ): Promise<void> {
    return this.decksService.removeWord(user.id, id, wordId);
  }
}
