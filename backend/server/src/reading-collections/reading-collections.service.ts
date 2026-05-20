import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReadingCollection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReadingCollectionDto } from './dto/create-reading-collection.dto';
import { ReadingCollectionDto } from './dto/reading-collection.dto';
import { UpdateReadingCollectionDto } from './dto/update-reading-collection.dto';

type CollectionWithCount = ReadingCollection & {
  _count: {
    readings: number;
  };
};

@Injectable()
export class ReadingCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<ReadingCollectionDto[]> {
    await this.ensureDefaultCollection(userId);

    const collections = await this.prisma.readingCollection.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            readings: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return collections.map((collection) => this.toDto(collection));
  }

  async create(
    userId: string,
    payload: CreateReadingCollectionDto,
  ): Promise<ReadingCollectionDto> {
    const name = payload.name.trim();
    const existingCollection = await this.prisma.readingCollection.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existingCollection) {
      throw new ConflictException('A collection with this name already exists.');
    }

    const collection = await this.prisma.readingCollection.create({
      data: {
        userId,
        name,
        description: payload.description,
      },
      include: {
        _count: {
          select: {
            readings: true,
          },
        },
      },
    });

    return this.toDto(collection);
  }

  async update(
    userId: string,
    collectionId: string,
    payload: UpdateReadingCollectionDto,
  ): Promise<ReadingCollectionDto> {
    const collection = await this.getOwnedCollection(userId, collectionId);
    const nextName = payload.name?.trim();

    if (nextName && nextName !== collection.name) {
      const existingCollection = await this.prisma.readingCollection.findUnique({
        where: {
          userId_name: {
            userId,
            name: nextName,
          },
        },
      });

      if (existingCollection) {
        throw new ConflictException('A collection with this name already exists.');
      }
    }

    const updatedCollection = await this.prisma.readingCollection.update({
      where: { id: collectionId },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
      },
      include: {
        _count: {
          select: {
            readings: true,
          },
        },
      },
    });

    return this.toDto(updatedCollection);
  }

  async remove(userId: string, collectionId: string): Promise<void> {
    const collection = await this.getOwnedCollection(userId, collectionId);

    if (collection.isDefault) {
      throw new BadRequestException('The default collection cannot be deleted.');
    }

    const defaultCollection = await this.ensureDefaultCollection(userId);
    await this.prisma.$transaction([
      this.prisma.reading.updateMany({
        where: {
          userId,
          collectionId,
        },
        data: {
          collectionId: defaultCollection.id,
        },
      }),
      this.prisma.readingCollection.delete({
        where: { id: collectionId },
      }),
    ]);
  }

  async ensureDefaultCollection(userId: string): Promise<ReadingCollection> {
    const existingDefault = await this.prisma.readingCollection.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    const defaultCollection =
      existingDefault ??
      (await this.prisma.readingCollection.create({
        data: {
          userId,
          name: 'Saved Readings',
          isDefault: true,
        },
      }));

    await this.prisma.reading.updateMany({
      where: {
        userId,
        collectionId: null,
      },
      data: {
        collectionId: defaultCollection.id,
      },
    });

    return defaultCollection;
  }

  async ensureCollectionOwnership(userId: string, collectionId: string): Promise<void> {
    await this.getOwnedCollection(userId, collectionId);
  }

  private async getOwnedCollection(
    userId: string,
    collectionId: string,
  ): Promise<ReadingCollection> {
    const collection = await this.prisma.readingCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with id "${collectionId}" not found.`);
    }

    return collection;
  }

  private toDto(collection: CollectionWithCount): ReadingCollectionDto {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isDefault: collection.isDefault,
      readingCount: collection._count.readings,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}
