import { Module } from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { BankTransactionsController } from './bank-transactions.controller';

@Module({
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService],
})
export class BankTransactionsModule {}
