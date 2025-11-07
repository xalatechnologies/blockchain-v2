import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created' })
  async createApiKey(@Request() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.authService.createApiKey(req.user.id, createApiKeyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all API keys for current user' })
  async getApiKeys(@Request() req) {
    return this.authService.getApiKeys(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    await this.authService.revokeApiKey(req.user.id, id);
    return { message: 'API key revoked' };
  }
}

