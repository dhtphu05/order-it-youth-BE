import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ManualCreateBankTransactionDto } from './dto/manual-create-bank-transaction.dto';

@Injectable()
export class BankTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Manually records a bank transaction based on statement data.
   * NOTE: This method only persists the provided payload. Auto-matching or payment
   * confirmation must be implemented elsewhere.
   */
  async manualCreate(dto: ManualCreateBankTransactionDto) {
    const existing = await this.prisma.bank_transactions.findUnique({
      where: { transaction_id: dto.transaction_id },
    });
    if (existing) {
      throw new ConflictException({
        error_code: 'BANK_TX_DUPLICATE',
        message: 'A bank transaction with this transaction_id already exists.',
      });
    }

    const occurredAt = new Date(dto.occurred_at);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException({
        error_code: 'INVALID_OCCURRED_AT',
        message: 'occurred_at must be a valid ISO 8601 timestamp.',
      });
    }

    const bankCode = process.env.PAYMENT_BANK_CODE ?? '';
    const accountNo = process.env.PAYMENT_ACCOUNT_NO ?? '';

    const data: Prisma.bank_transactionsCreateInput = {
      bank_code: bankCode,
      account_no: accountNo,
      amount_vnd: dto.amount_vnd,
      occurred_at: occurredAt,
      transaction_id: dto.transaction_id,
      narrative: dto.narrative,
      matched_order_code: dto.matched_order_code ?? null,
    };

    if (dto.raw !== undefined) {
      data.raw = dto.raw as Prisma.InputJsonValue;
    }

    return this.prisma.bank_transactions.create({ data });
  }
}
