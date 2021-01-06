import { HttpService, Inject, Injectable } from '@nestjs/common';
import { GeneralConfig } from '../../../configuration.providers';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class PartnerOrdersService {
  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(GeneralConfig.KEY)
    private generalConfig: ConfigType<typeof GeneralConfig>,
  ) {}

  async updateOrderStatus(orderId: string, state: string) {
    // We are loosing preconfigured httpService somehow on first request so we use injected config
    return this.httpService
      .patch<undefined>(
        `${this.generalConfig.partner_api_uri}/api/orders/${orderId}`,
        { state },
        {
          headers: {
            'X-API-KEY': this.generalConfig.partner_out_api_key,
          },
        },
      )
      .toPromise();
  }
}
