import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDto } from './dto/user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface AuthTokenBundle {
  auth: AuthResponseDto;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(payload: RegisterDto): Promise<AuthTokenBundle> {
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await this.usersService.create(payload.email, passwordHash);

    return this.createSessionAndBuildResponse(user);
  }

  async login(payload: LoginDto): Promise<AuthTokenBundle> {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createSessionAndBuildResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokenBundle> {
    const sessionId = this.getSessionId(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (session.refreshTokenHash !== this.hashRefreshToken(refreshToken)) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Refresh token reuse detected.');
    }

    const nextRefreshToken = this.generateRefreshToken(session.id);
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashRefreshToken(nextRefreshToken),
      },
    });

    return {
      auth: await this.buildAuthResponse(session.user),
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const sessionId = this.getSessionId(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.refreshTokenHash !== this.hashRefreshToken(refreshToken)
    ) {
      return;
    }

    await this.revokeSession(session.id);
  }

  private async createSessionAndBuildResponse(
    user: User,
  ): Promise<AuthTokenBundle> {
    const sessionId = randomUUID();
    const refreshToken = this.generateRefreshToken(sessionId);
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    return {
      auth: await this.buildAuthResponse(user),
      refreshToken,
    };
  }

  private async buildAuthResponse(
    user: Pick<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>,
  ): Promise<AuthResponseDto> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: await this.jwtService.signAsync(jwtPayload),
      user: this.toUserDto(user),
    };
  }

  private toUserDto(
    user: Pick<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>,
  ): UserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateRefreshToken(sessionId: string): string {
    return `${sessionId}.${randomBytes(64).toString('base64url')}`;
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private getRefreshTokenExpiry(): Date {
    const ttlDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30',
    );

    return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }

  private getSessionId(refreshToken: string): string {
    const [sessionId] = refreshToken.split('.', 1);

    if (!sessionId) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return sessionId;
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
