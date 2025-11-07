import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My API Key' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'API key for production', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['read', 'write'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

