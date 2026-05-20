import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { AnalysisTokenDto } from './dto/analysis-token.dto';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  @ApiOperation({
    summary: 'Analyze Chinese text for graded reading',
  })
  @ApiResponse({
    status: 201,
    description: 'Chinese text analyzed successfully.',
    type: AnalysisTokenDto,
    isArray: true,
  })
  analyze(@Body() analyzeTextDto: AnalyzeTextDto): Promise<AnalysisTokenDto[]> {
    return this.analysisService.analyze(analyzeTextDto);
  }
}
