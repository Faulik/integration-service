import { Module } from '@nestjs/common';

import { OrdersProcessingModule } from '../../orders/orders-processing.module';
import { OrdersController } from './orders.controller';
import { TokenAuthGuard } from '../../utils/token-auth.guard';
import { OrdersService } from './orders.service';

@Module({
  imports: [OrdersProcessingModule],
  controllers: [OrdersController],
  providers: [OrdersService, TokenAuthGuard],
})
export class OrdersModule {}
