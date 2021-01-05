import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { PartnerOrdersService } from '../partner/orders/partner-orders.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { TigerOrderService } from '../../tiger/orders/tiger-order.service';
import { CreateOrderDto } from '../../api/orders/dto/create-order.dto';

@Injectable()
export class OrdersProcessingService {
  constructor(
    @InjectQueue('statusChecks') private statusChecksQueue: Queue,

    @InjectRepository(Order)
    private ordersRepository: MongoRepository<Order>,

    @Inject(TigerOrderService) private tigerOrderService: TigerOrderService,

    @Inject(PartnerOrdersService)
    private partnerOrdersService: PartnerOrdersService,
  ) {}

  async processNewOrder(newOrder: CreateOrderDto) {
    const { result } = await this.ordersRepository.insertOne({
      status: OrderStatus.new,
      order: newOrder,
    });

    if (result.ok) {
      await this.tigerOrderService.issueNewOrder(newOrder);

      await this.statusChecksQueue.add(
        {
          orderId: newOrder.id,
        },
        {
          delay: 1000 * 60 * 2,
          repeat: {
            every: 1000 * 60 * 2,
          },
          removeOnComplete: true,
          jobId: `order_${newOrder.id}`,
        },
      );
    }

    return true;
  }

  async submitFinishedOrder(orderId: string) {
    await this.statusChecksQueue.removeRepeatable({
      every: 1000 * 60 * 2,
      jobId: `order_${orderId}`,
    });
    await this.partnerOrdersService.updateOrderStatus(orderId, 'finished');
  }
}
