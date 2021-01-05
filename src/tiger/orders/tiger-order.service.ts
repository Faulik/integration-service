import { HttpService, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../../api/orders/dto/create-order.dto';
import { FromOrderService } from './from-order.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TigerOrderService {
  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(FromOrderService) private fromOrderService: FromOrderService,
    @InjectQueue('statusChecks') private statusChecksQueue: Queue,
  ) {}

  async create(order: CreateOrderDto) {
    const transformedOrder = await this.fromOrderService.transform(order);

    const result = await this.httpService
      .post<undefined>('/api/orders', transformedOrder)
      .toPromise();

    if (result.status !== 200) {
      throw new Error('Failed to submit order');
    }

    await this.statusChecksQueue.add(
      {
        orderId: transformedOrder.OrderID,
      },
      {
        delay: 1000 * 60 * 2,
        repeat: {
          every: 1000 * 60 * 2,
        },
        removeOnComplete: true,
        jobId: `tiger_order_${transformedOrder.OrderID}`,
      },
    );
  }

  async checkOrderStatus(orderId: string) {
    return this.httpService
      .get<{
        OrderID: string;
        Reason: number;
        State: 'Pending' | 'New' | 'InProduction' | 'Finished';
      }>(`kek.com/api/orders/${orderId}/state`)
      .toPromise();
  }
}
