import { HttpModule, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { TransformOrderService } from './orders/transform-order.service';
import { TigerOrderService } from './orders/tiger-order.service';
import { CarriersService } from './orders/carriers/carriers.service';
import { generalConfig } from '../configuration.providers';
import { GeoService } from '../utils/geo/geo.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigType<typeof generalConfig>) => ({
        baseURL: configService.tiger_api_uri,
      }),
      inject: [generalConfig.KEY],
    }),
  ],
  providers: [
    TransformOrderService,
    TigerOrderService,
    CarriersService,
    GeoService,
  ],
  exports: [TigerOrderService],
})
export class TigerModule {}
