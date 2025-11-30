import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BankTransactionsService } from './bank-transactions.service';
import { ManualCreateBankTransactionDto } from './dto/manual-create-bank-transaction.dto';

@ApiTags('Admin – Bank Transactions')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('bank-transactions')
export class BankTransactionsController {
  constructor(
    private readonly bankTransactionsService: BankTransactionsService,
  ) {}

  @Post('manual-create')
  @ApiOperation({
    summary: 'Manually register a bank transaction',
    description:
      'Admin nhập tay dữ liệu giao dịch từ sao kê; endpoint này chỉ lưu giao dịch và KHÔNG tự đối soát hoặc xác nhận đơn hàng.',
  })
  @ApiBody({ type: ManualCreateBankTransactionDto })
  @ApiResponse({
    status: 201,
    description: 'Bank transaction created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or parsing error.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate transaction_id detected.',
    type: ErrorResponseDto,
  })
  manualCreate(@Body() dto: ManualCreateBankTransactionDto) {
    return this.bankTransactionsService.manualCreate(dto);
  }
}
