import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExamplesController } from './examples.controller';
import { ExamplesService } from './examples.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExamplesController],
  providers: [ExamplesService],
})
export class ExamplesModule {}
