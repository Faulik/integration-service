import { Inject, Injectable } from '@nestjs/common';

import { OrdersProcessingService } from '../../orders/processing/orders-processing.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(OrdersProcessingService)
    private ordersProcessingService: OrdersProcessingService,
  ) {}

  async create(newOrder: CreateOrderDto) {
    await this.ordersProcessingService.processNewOrder(newOrder);

    return undefined;
  }
}
