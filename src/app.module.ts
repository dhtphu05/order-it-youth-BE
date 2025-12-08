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
import { AdminTeamsModule } from './admin/teams/admin-teams.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AdminStatisticsModule } from './admin/statistics/admin-statistics.module';
import { PosModule } from './pos/pos.module';
import { TeamModule } from './team/team.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    BankTransactionsModule,
    AdminProductsModule,
    AdminCombosModule,
    AdminStatisticsModule,
    PosModule,
    AdminOrdersModule,
    AdminTeamsModule,
    AdminUsersModule,
    TeamModule,
  ],
})
export class AppModule { }
