import { HttpModule, Module } from '@nestjs/common';

import { TigerOrderService } from './orders/tiger-order.service';
import { FromOrderService } from './orders/from-order.service';
import { CarriersService } from './orders/carriers/carriers.service';
import { GeoService } from '../utils/geo/geo.service';
import { BullModule } from '@nestjs/bull';
import { ConfigType } from '@nestjs/config';
import { generalConfig } from '../configuration.providers';
import { PartnerModule } from '../partner/partner.module';
import { OrderCheckProcessor } from './orders/order-check.processor';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigType<typeof generalConfig>) => ({
        baseURL: configService.tiger_api_uri,
      }),
      inject: [generalConfig.KEY],
    }),
    BullModule.registerQueue({
      name: 'statusChecks',
    }),
    PartnerModule,
  ],
  providers: [
    OrderCheckProcessor,
    TigerOrderService,
    CarriersService,
    FromOrderService,
    CarriersService,
    GeoService,
  ],
  exports: [TigerOrderService],
})
export class TigerModule {}
