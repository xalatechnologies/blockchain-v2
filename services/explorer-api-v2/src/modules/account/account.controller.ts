import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { GetBalanceDto } from './dto/get-balance.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Public()
  @Get('balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Query() dto: GetBalanceDto) {
    return this.accountService.getBalance(dto);
  }

  @Public()
  @Get('txlist')
  @ApiOperation({ summary: 'Get transaction list for an address' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(@Query() dto: GetTransactionsDto) {
    return this.accountService.getTransactions(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get account summary (requires authentication)' })
  async getAccountSummary(@Query('address') address: string) {
    return this.accountService.getAccountSummary(address);
  }
}

