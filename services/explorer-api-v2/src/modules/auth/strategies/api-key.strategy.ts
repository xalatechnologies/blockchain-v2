import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// Custom API Key Strategy
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }
    const key = await this.authService.validateApiKey(apiKey);
    if (!key) {
      throw new UnauthorizedException('Invalid API key');
    }
    return key;
  }
}

