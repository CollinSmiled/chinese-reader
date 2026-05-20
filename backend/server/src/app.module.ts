import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';
import { DecksModule } from './decks/decks.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReadingCollectionsModule } from './reading-collections/reading-collections.module';
import { ReadingsModule } from './readings/readings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    AnalysisModule,
    DecksModule,
    DictionaryModule,
    HealthModule,
    ReadingCollectionsModule,
    ReadingsModule,
  ],
})
export class AppModule {}
