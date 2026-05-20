import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './interfaces/auth-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly refreshCookieName = 'refresh_token';

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a user account',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  async register(
    @Body() payload: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(payload);
    this.setRefreshCookie(response, result.refreshToken);
    return result.auth;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Sign in and receive an access token',
  })
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully.',
    type: AuthResponseDto,
  })
  async login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(payload);
    this.setRefreshCookie(response, result.refreshToken);
    return result.auth;
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate a refresh token and issue a new token pair',
  })
  @ApiResponse({
    status: 200,
    description: 'Token pair refreshed successfully.',
    type: AuthResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = this.getRefreshToken(request);
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, result.refreshToken);
    return result.auth;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiOperation({
    summary: 'Invalidate a refresh-token session',
  })
  @ApiResponse({
    status: 204,
    description: 'Session revoked successfully.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.getRefreshToken(request);
    await this.authService.logout(refreshToken);
    this.clearRefreshCookie(response);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully.',
    type: UserDto,
  })
  getCurrentUser(@CurrentUser() user: AuthUser): UserDto {
    return user;
  }

  private getRefreshToken(request: Request): string {
    const refreshToken = request.cookies?.[this.refreshCookieName];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie missing.');
    }

    return refreshToken;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(this.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: this.getRefreshCookieMaxAge(),
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  private getRefreshCookieMaxAge(): number {
    const ttlDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30',
    );

    return ttlDays * 24 * 60 * 60 * 1000;
  }
}
