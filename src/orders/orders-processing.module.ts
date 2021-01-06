import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { OrdersProcessingService } from './processing/orders-processing.service';
import { OrderDeliveryProcessor } from './processing/order-delivery.processor';
import { OrderCheckProcessor } from './processing/order-check.processor';
import { PartnerModule } from './partner/partner.module';
import { TigerModule } from '../tiger/tiger.module';
import { Order } from './entities/order.entity';

@Module({
  providers: [
    OrdersProcessingService,
    OrderDeliveryProcessor,
    OrderCheckProcessor,
  ],
  imports: [
    TypeOrmModule.forFeature([Order]),
    BullModule.registerQueue(
      { name: 'orderChecks' },
      {
        name: 'orderDelivery',
      },
    ),
    PartnerModule,
    TigerModule,
  ],
  exports: [OrdersProcessingService],
})
export class OrdersProcessingModule {}
