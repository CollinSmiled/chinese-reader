import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExampleSentenceDto } from './dto/example-sentence.dto';
import { ExamplesService } from './examples.service';

@ApiTags('examples')
@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  @ApiOperation({
    summary: 'Find learner-friendly example sentences for a Chinese word',
  })
  @ApiQuery({
    name: 'word',
    example: '好',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Example sentences returned successfully.',
    type: ExampleSentenceDto,
    isArray: true,
  })
  search(
    @Query('word') word = '',
    @Query('limit') limit?: string,
  ): Promise<ExampleSentenceDto[]> {
    return this.examplesService.search(word, Number(limit ?? 5));
  }
}
