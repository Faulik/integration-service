import { HttpService, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PartnerOrdersService {
  constructor(@Inject(HttpService) private httpService: HttpService) {}

  async updateOrderStatus(orderId: string, state: string) {
    return this.httpService
      .patch<undefined>(`api/orders/${orderId}`, { state })
      .toPromise();
  }
}
