import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BankTransactionsService } from './bank-transactions.service';
import { ManualCreateBankTransactionDto } from './dto/manual-create-bank-transaction.dto';

@ApiTags('Bank Transactions')
@Controller('bank-transactions')
export class BankTransactionsController {
  constructor(
    private readonly bankTransactionsService: BankTransactionsService,
  ) {}

  @Post('manual-create')
  @ApiOperation({ summary: 'Nhập tay một giao dịch sao kê' })
  manualCreate(@Body() dto: ManualCreateBankTransactionDto) {
    return this.bankTransactionsService.manualCreate(dto);
  }
}
