import { Module } from '@nestjs/common';

import { OrdersProcessingModule } from '../../orders/orders-processing.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [OrdersProcessingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
