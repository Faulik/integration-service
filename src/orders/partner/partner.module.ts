import { HttpModule, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { PartnerOrdersService } from './orders/partner-orders.service';
import { GeneralConfig } from '../../configuration.providers';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigType<typeof GeneralConfig>) => ({
        baseURL: configService.partner_api_uri,
        headers: {
          'X-API-KEY': configService.partner_out_api_key,
        },
      }),
      inject: [GeneralConfig.KEY],
    }),
  ],
  providers: [PartnerOrdersService],
  exports: [PartnerOrdersService],
})
export class PartnerModule {}
