import { HttpService, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from '../../api/orders/dto/create-order.dto';
import { TransformOrderService } from './transform-order.service';
import { GeneralConfig } from '../../configuration.providers';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class TigerOrderService {
  private readonly logger = new Logger(TigerOrderService.name);

  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(TransformOrderService)
    private fromOrderService: TransformOrderService,
    @Inject(GeneralConfig.KEY)
    private generalConfig: ConfigType<typeof GeneralConfig>,
  ) {}

  async issueNewOrder(order: CreateOrderDto) {
    const transformedOrder = await this.fromOrderService.transform(order);

    const result = await this.httpService
      .post<undefined>('/api/orders', transformedOrder)
      .toPromise();

    if (result.status !== 200) {
      throw new Error(`Failed to submit order, error: ${result.data}`);
    }

    return result;
  }

  async checkOrderStatus(orderId: string) {
    // We are loosing preconfigured httpService somehow on first request so we use injected config
    const result = await this.httpService
      .get<{
        OrderID: string;
        Reason: number;
        State: 'Pending' | 'New' | 'InProduction' | 'Finished';
      }>(`${this.generalConfig.tiger_api_uri}/api/orders/${orderId}/state`, {
        auth: {
          username: this.generalConfig.tiger_api_username,
          password: this.generalConfig.tiger_api_password,
        },
      })
      .toPromise();

    if (result.status !== 200) {
      throw new Error(`Failed to submit order, error: ${result.data}`);
    }

    return result;
  }
}
