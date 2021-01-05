import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { TigerModule } from '../../tiger/tiger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), TigerModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
