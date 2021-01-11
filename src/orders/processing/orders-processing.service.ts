import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(OrdersProcessingService.name);

  constructor(
    @InjectQueue('orderChecks') private orderChecksQueue: Queue,
    @InjectQueue('orderDelivery') private orderDeliveryQueue: Queue,

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

    if (!result.ok) {
      throw new Error('Failed to save order');
    }

    try {
      this.logger.log('Issuing new order', `orderId: ${newOrder.id}`);
      await this.tigerOrderService.issueNewOrder(newOrder);
    } catch (e) {
      await this.flagOrderAsFailed(String(newOrder.id));
      throw e;
    }

    this.logger.log('Adding new check order job', `orderId: ${newOrder.id}`);
    await this.orderChecksQueue.add(
      {
        orderId: newOrder.id,
      },
      {
        delay: 1000 * 60,
        repeat: {
          every: 1000 * 60,
        },
        removeOnComplete: true,
        jobId: `order_${newOrder.id}`,
      },
    );

    return true;
  }

  async checkOrderStatus(orderId: string) {
    this.logger.log('Checking order status', `orderId: ${orderId}`);

    try {
      const { data } = await this.tigerOrderService.checkOrderStatus(orderId);
      this.logger.log(
        `Got new order status ${data.State}`,
        `orderId: ${orderId}`,
      );
      return data;
    } catch (e) {
      await this.flagOrderAsFailed(orderId);
      throw e;
    }
  }

  async submitFinishedOrder(orderId: string) {
    await this.orderChecksQueue.removeRepeatable({
      every: 1000 * 60,
      jobId: `order_${orderId}`,
    });

    this.logger.log('Adding order to be delivered', `orderId: ${orderId}`);
    await this.orderDeliveryQueue.add({
      orderId: orderId,
    });

    await this.ordersRepository.updateOne(
      {
        'order.id': orderId,
      },
      {
        $set: {
          status: OrderStatus.done,
        },
      },
    );
  }

  async submitDeliveredOrder(orderId: string) {
    this.logger.log('Submitting order back to partner', `orderId: ${orderId}`);

    try {
      await this.partnerOrdersService.updateOrderStatus(orderId, 'Finished');
    } catch (e) {
      await this.flagOrderAsFailed(orderId);
      throw e;
    }

    await this.ordersRepository.updateOne(
      {
        'order.id': orderId,
      },
      {
        $set: {
          status: OrderStatus.delivered,
        },
      },
    );
  }

  async flagOrderAsFailed(orderId: string) {
    this.logger.log('Flagging order as failed', `orderId: ${orderId}`);

    await this.ordersRepository.updateOne(
      {
        'order.id': orderId,
      },
      {
        $set: {
          status: OrderStatus.failed,
        },
      },
    );
  }
}
