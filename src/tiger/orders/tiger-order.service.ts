import { HttpService, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../../api/orders/dto/create-order.dto';
import { TransformOrderService } from './transform-order.service';

@Injectable()
export class TigerOrderService {
  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(TransformOrderService)
    private fromOrderService: TransformOrderService,
  ) {}

  async issueNewOrder(order: CreateOrderDto) {
    const transformedOrder = await this.fromOrderService.transform(order);

    const result = await this.httpService
      .post<undefined>('/api/orders', transformedOrder)
      .toPromise();

    if (result.status !== 200) {
      throw new Error('Failed to submit order');
    }
  }

  async checkOrderStatus(orderId: string) {
    return this.httpService
      .get<{
        OrderID: string;
        Reason: number;
        State: 'Pending' | 'New' | 'InProduction' | 'Finished';
      }>(`api/orders/${orderId}/state`)
      .toPromise();
  }
}
