import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManualCreateBankTransactionDto } from './dto/manual-create-bank-transaction.dto';

const ORDER_CODE_REGEX = /OIY-26-[A-Z0-9]{5}/i;

@Injectable()
export class BankTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async manualCreate(dto: ManualCreateBankTransactionDto) {
    const existed = await this.prisma.bank_transactions.findUnique({
      where: { transaction_id: dto.transaction_id },
    });
    if (existed) {
      throw new BadRequestException({
        code: 'BANK_TX_DUPLICATE_TRANSACTION_ID',
        message: 'Transaction already exists',
      });
    }

    const matchedOrderCode =
      this.extractOrderCode(dto.narrative) ??
      this.extractOrderCode(dto.transaction_id);

    const record = await this.prisma.bank_transactions.create({
      data: {
        bank_code: dto.bank_code,
        account_no: dto.account_no,
        amount_vnd: dto.amount_vnd,
        occurred_at: new Date(dto.occurred_at),
        transaction_id: dto.transaction_id,
        narrative: dto.narrative ?? null,
        raw: dto.raw ?? undefined,
        matched_order_code: matchedOrderCode,
      },
    });

    return record;
  }

  private extractOrderCode(source?: string | null): string | null {
    if (!source) {
      return null;
    }
    const match = source.match(ORDER_CODE_REGEX);
    return match ? match[0].toUpperCase() : null;
  }
}
