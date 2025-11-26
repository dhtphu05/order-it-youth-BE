import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { BankTransactionsModule } from './bank-transactions/bank-transactions.module';
import { AdminProductsModule } from './admin/products/admin-products.module';
import { AdminCombosModule } from './admin/combos/admin-combos.module';
import { AdminOrdersModule } from './admin/orders/admin-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    BankTransactionsModule,
    AdminProductsModule,
    AdminCombosModule,
    AdminOrdersModule,
  ],
})
export class AppModule {}
