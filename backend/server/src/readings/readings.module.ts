import { Module } from '@nestjs/common';
import { ReadingCollectionsModule } from '../reading-collections/reading-collections.module';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';

@Module({
  imports: [ReadingCollectionsModule],
  controllers: [ReadingsController],
  providers: [ReadingsService],
})
export class ReadingsModule {}
