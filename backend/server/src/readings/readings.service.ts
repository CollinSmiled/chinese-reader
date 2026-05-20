import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Reading } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReadingCollectionsService } from '../reading-collections/reading-collections.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingDto } from './dto/reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';

type ReadingWithCollection = Reading & {
  collection?: {
    name: string;
  } | null;
};

@Injectable()
export class ReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collectionsService: ReadingCollectionsService,
  ) {}

  async create(userId: string, payload: CreateReadingDto): Promise<ReadingDto> {
    const collectionId =
      payload.collectionId ??
      (await this.collectionsService.ensureDefaultCollection(userId)).id;

    await this.collectionsService.ensureCollectionOwnership(userId, collectionId);

    const reading = await this.prisma.reading.create({
      data: {
        title: payload.title,
        userId,
        collectionId,
        originalText: payload.originalText,
        analyzedContent:
          payload.analyzedContent as unknown as Prisma.InputJsonValue,
        wordCount: payload.analyzedContent.length,
        estimatedHskLevel: payload.estimatedHskLevel,
      },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toDto(reading);
  }

  async findAll(userId: string, collectionId?: string): Promise<ReadingDto[]> {
    await this.collectionsService.ensureDefaultCollection(userId);
    if (collectionId) {
      await this.collectionsService.ensureCollectionOwnership(userId, collectionId);
    }

    const readings = await this.prisma.reading.findMany({
      where: { userId, ...(collectionId ? { collectionId } : {}) },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return readings.map((reading) => this.toDto(reading));
  }

  async findOne(userId: string, id: string): Promise<ReadingDto> {
    const reading = await this.prisma.reading.findFirst({
      where: { id, userId },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!reading) {
      throw new NotFoundException(`Reading with id "${id}" not found.`);
    }

    return this.toDto(reading);
  }

  async update(userId: string, id: string, payload: UpdateReadingDto): Promise<ReadingDto> {
    const reading = await this.prisma.reading.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!reading) {
      throw new NotFoundException(`Reading with id "${id}" not found.`);
    }

    if (payload.collectionId) {
      await this.collectionsService.ensureCollectionOwnership(userId, payload.collectionId);
    }

    const updatedReading = await this.prisma.reading.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.collectionId !== undefined ? { collectionId: payload.collectionId } : {}),
        ...(payload.originalText !== undefined ? { originalText: payload.originalText } : {}),
        ...(payload.analyzedContent !== undefined
          ? {
              analyzedContent:
                payload.analyzedContent as unknown as Prisma.InputJsonValue,
              wordCount: payload.analyzedContent.length,
            }
          : {}),
        ...(payload.estimatedHskLevel !== undefined
          ? { estimatedHskLevel: payload.estimatedHskLevel }
          : {}),
      },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toDto(updatedReading);
  }

  async remove(userId: string, id: string): Promise<void> {
    const reading = await this.prisma.reading.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!reading) {
      throw new NotFoundException(`Reading with id "${id}" not found.`);
    }

    await this.prisma.reading.delete({
      where: { id },
    });
  }

  private toDto(reading: ReadingWithCollection): ReadingDto {
    return {
      ...reading,
      collectionName: reading.collection?.name ?? null,
      analyzedContent: reading.analyzedContent as unknown as ReadingDto['analyzedContent'],
    };
  }
}
