import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReadingCollectionsController } from './reading-collections.controller';
import { ReadingCollectionsService } from './reading-collections.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingCollectionsController],
  providers: [ReadingCollectionsService],
  exports: [ReadingCollectionsService],
})
export class ReadingCollectionsModule {}
