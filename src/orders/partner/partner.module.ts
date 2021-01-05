import { HttpModule, Module } from '@nestjs/common';
import { PartnerOrdersService } from './orders/partner-orders.service';
import { ConfigType } from '@nestjs/config';
import { generalConfig } from '../../configuration.providers';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigType<typeof generalConfig>) => ({
        baseURL: configService.partner_api_uri,
      }),
      inject: [generalConfig.KEY],
    }),
  ],
  providers: [PartnerOrdersService],
  exports: [PartnerOrdersService],
})
export class PartnerModule {}
