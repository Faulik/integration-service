import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { OrdersProcessingService } from './processing/orders-processing.service';
import { OrderCheckProcessor } from './processing/order-check.processor';
import { PartnerModule } from './partner/partner.module';
import { TigerModule } from '../tiger/tiger.module';
import { Order } from './entities/order.entity';

@Module({
  providers: [OrdersProcessingService, OrderCheckProcessor],
  imports: [
    TypeOrmModule.forFeature([Order]),
    BullModule.registerQueue({
      name: 'statusChecks',
    }),
    PartnerModule,
    TigerModule,
  ],
  exports: [OrdersProcessingService],
})
export class OrdersProcessingModule {}
