import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';
import { DictionaryResultDto } from './dto/dictionary-result.dto';
import { DictionarySearchQueryDto } from './dto/dictionary-search-query.dto';

@ApiTags('dictionary')
@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search the Chinese dictionary',
  })
  @ApiResponse({
    status: 200,
    description: 'Dictionary results returned successfully.',
    type: DictionaryResultDto,
    isArray: true,
  })
  search(@Query() query: DictionarySearchQueryDto): Promise<DictionaryResultDto[]> {
    return this.dictionaryService.search(query.q, query.limit ?? 20);
  }
}
