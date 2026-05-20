import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Deck } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { CreateDeckWordDto } from './dto/create-deck-word.dto';
import { DeckDto } from './dto/deck.dto';
import { DeckWordDto } from './dto/deck-word.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

type DeckWithCount = Deck & {
  _count: {
    words: number;
  };
};

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<DeckDto[]> {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            words: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return decks.map((deck) => this.toDto(deck));
  }

  async create(userId: string, payload: CreateDeckDto): Promise<DeckDto> {
    const existingDeck = await this.prisma.deck.findUnique({
      where: {
        userId_name: {
          userId,
          name: payload.name,
        },
      },
    });

    if (existingDeck) {
      throw new ConflictException('A deck with this name already exists.');
    }

    const deck = await this.prisma.deck.create({
      data: {
        userId,
        name: payload.name,
        description: payload.description,
      },
      include: {
        _count: {
          select: {
            words: true,
          },
        },
      },
    });

    return this.toDto(deck);
  }

  async update(userId: string, deckId: string, payload: UpdateDeckDto): Promise<DeckDto> {
    const deck = await this.getOwnedDeck(userId, deckId);
    const nextName = payload.name?.trim();

    if (nextName && nextName !== deck.name) {
      const existingDeck = await this.prisma.deck.findUnique({
        where: {
          userId_name: {
            userId,
            name: nextName,
          },
        },
      });

      if (existingDeck) {
        throw new ConflictException('A deck with this name already exists.');
      }
    }

    const updatedDeck = await this.prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
      },
      include: {
        _count: {
          select: {
            words: true,
          },
        },
      },
    });

    return this.toDto(updatedDeck);
  }

  async remove(userId: string, deckId: string): Promise<void> {
    const deck = await this.getOwnedDeck(userId, deckId);

    if (deck.isDefault) {
      throw new BadRequestException('The default deck cannot be deleted.');
    }

    await this.prisma.deck.delete({
      where: { id: deckId },
    });
  }

  async findWords(userId: string, deckId: string): Promise<DeckWordDto[]> {
    await this.ensureDeckOwnership(userId, deckId);

    const words = await this.prisma.deckWord.findMany({
      where: { deckId },
      include: {
        vocabularyEntry: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return words.map((word) => ({
      id: word.id,
      word: word.vocabularyEntry.word,
      pinyin: word.vocabularyEntry.pinyin,
      meaning: word.vocabularyEntry.meaning,
      hskLevel: word.vocabularyEntry.hskLevel,
      sourceReadingId: word.sourceReadingId,
      exampleSentence: word.exampleSentence,
      createdAt: word.createdAt,
    }));
  }

  async addWord(
    userId: string,
    deckId: string,
    payload: CreateDeckWordDto,
  ): Promise<DeckWordDto> {
    await this.ensureDeckOwnership(userId, deckId);

    const vocabularyEntry = await this.prisma.vocabularyEntry.findFirst({
      where: {
        word: payload.word,
        pinyin: payload.pinyin,
      },
    });

    const entry =
      vocabularyEntry ??
      (await this.prisma.vocabularyEntry.create({
        data: {
          word: payload.word,
          pinyin: payload.pinyin,
          meaning: payload.meaning,
          hskLevel: payload.hskLevel,
        },
      }));

    const existingDeckWord = await this.prisma.deckWord.findUnique({
      where: {
        deckId_vocabularyEntryId: {
          deckId,
          vocabularyEntryId: entry.id,
        },
      },
    });

    if (existingDeckWord) {
      throw new ConflictException('This word is already in the deck.');
    }

    const deckWord = await this.prisma.deckWord.create({
      data: {
        deckId,
        vocabularyEntryId: entry.id,
        sourceReadingId: payload.sourceReadingId,
        exampleSentence: payload.exampleSentence,
      },
      include: {
        vocabularyEntry: true,
      },
    });

    return {
      id: deckWord.id,
      word: deckWord.vocabularyEntry.word,
      pinyin: deckWord.vocabularyEntry.pinyin,
      meaning: deckWord.vocabularyEntry.meaning,
      hskLevel: deckWord.vocabularyEntry.hskLevel,
      sourceReadingId: deckWord.sourceReadingId,
      exampleSentence: deckWord.exampleSentence,
      createdAt: deckWord.createdAt,
    };
  }

  async removeWord(userId: string, deckId: string, wordId: string): Promise<void> {
    await this.ensureDeckOwnership(userId, deckId);

    const deckWord = await this.prisma.deckWord.findFirst({
      where: {
        id: wordId,
        deckId,
      },
    });

    if (!deckWord) {
      throw new NotFoundException(`Word with id "${wordId}" not found in this deck.`);
    }

    await this.prisma.deckWord.delete({
      where: {
        id: wordId,
      },
    });
  }

  async moveWord(
    userId: string,
    sourceDeckId: string,
    wordId: string,
    targetDeckId: string,
  ): Promise<DeckWordDto> {
    await this.ensureDeckOwnership(userId, sourceDeckId);
    await this.ensureDeckOwnership(userId, targetDeckId);

    if (sourceDeckId === targetDeckId) {
      throw new BadRequestException('Source and target decks are the same.');
    }

    const deckWord = await this.prisma.deckWord.findFirst({
      where: {
        id: wordId,
        deckId: sourceDeckId,
      },
      include: {
        vocabularyEntry: true,
      },
    });

    if (!deckWord) {
      throw new NotFoundException(`Word with id "${wordId}" not found in this deck.`);
    }

    const existingTargetWord = await this.prisma.deckWord.findUnique({
      where: {
        deckId_vocabularyEntryId: {
          deckId: targetDeckId,
          vocabularyEntryId: deckWord.vocabularyEntryId,
        },
      },
    });

    if (existingTargetWord) {
      throw new ConflictException('This word already exists in the target deck.');
    }

    const movedWord = await this.prisma.deckWord.update({
      where: { id: wordId },
      data: {
        deckId: targetDeckId,
      },
      include: {
        vocabularyEntry: true,
      },
    });

    return this.toDeckWordDto(movedWord);
  }

  private toDto(deck: DeckWithCount): DeckDto {
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      isDefault: deck.isDefault,
      wordCount: deck._count.words,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  }

  private toDeckWordDto(
    deckWord: Awaited<ReturnType<typeof this.prisma.deckWord.findFirstOrThrow>> & {
      vocabularyEntry: {
        word: string;
        pinyin: string | null;
        meaning: string | null;
        hskLevel: number | null;
      };
    },
  ): DeckWordDto {
    return {
      id: deckWord.id,
      word: deckWord.vocabularyEntry.word,
      pinyin: deckWord.vocabularyEntry.pinyin,
      meaning: deckWord.vocabularyEntry.meaning,
      hskLevel: deckWord.vocabularyEntry.hskLevel,
      sourceReadingId: deckWord.sourceReadingId,
      exampleSentence: deckWord.exampleSentence,
      createdAt: deckWord.createdAt,
    };
  }

  private async getOwnedDeck(userId: string, deckId: string): Promise<Deck> {
    const deck = await this.prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new NotFoundException(`Deck with id "${deckId}" not found.`);
    }

    return deck;
  }

  private async ensureDeckOwnership(userId: string, deckId: string): Promise<void> {
    await this.getOwnedDeck(userId, deckId);
  }
}
