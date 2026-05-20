import { PartialType } from '@nestjs/swagger';
import { CreateReadingCollectionDto } from './create-reading-collection.dto';

export class UpdateReadingCollectionDto extends PartialType(CreateReadingCollectionDto) {}
