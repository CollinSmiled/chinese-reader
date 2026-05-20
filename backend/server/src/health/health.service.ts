import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthStatusDto } from './dto/health-status.dto';
import { ServiceHealthDto } from './dto/service-health.dto';

@Injectable()
export class HealthService {
  private readonly analyzerUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.analyzerUrl =
      this.configService.get<string>('ANALYZER_URL') ?? 'http://localhost:8000';
  }

  getApiHealth(): HealthStatusDto {
    return {
      status: 'ok',
    };
  }

  async getAnalyzerHealth(): Promise<ServiceHealthDto> {
    try {
      const response = await fetch(`${this.analyzerUrl}/health`);

      return {
        service: 'analyzer',
        status: response.ok ? 'ok' : 'unavailable',
      };
    } catch {
      return {
        service: 'analyzer',
        status: 'unavailable',
      };
    }
  }
}
