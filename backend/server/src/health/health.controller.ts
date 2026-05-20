import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthStatusDto } from './dto/health-status.dto';
import { ServiceHealthDto } from './dto/service-health.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check NestJS API health',
  })
  @ApiResponse({
    status: 200,
    description: 'NestJS API is running.',
    type: HealthStatusDto,
  })
  getApiHealth(): HealthStatusDto {
    return this.healthService.getApiHealth();
  }

  @Get('analyzer')
  @ApiOperation({
    summary: 'Check Python analyzer health',
  })
  @ApiResponse({
    status: 200,
    description: 'Analyzer health check completed.',
    type: ServiceHealthDto,
  })
  getAnalyzerHealth(): Promise<ServiceHealthDto> {
    return this.healthService.getAnalyzerHealth();
  }
}
