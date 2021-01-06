import { HttpModule, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { TransformOrderService } from './orders/transform-order.service';
import { TigerOrderService } from './orders/tiger-order.service';
import { CarriersService } from './orders/carriers/carriers.service';
import { GeneralConfig } from '../configuration.providers';
import { GeoService } from '../utils/geo/geo.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigType<typeof GeneralConfig>) => ({
        baseURL: configService.tiger_api_uri,
        auth: {
          username: configService.tiger_api_username,
          password: configService.tiger_api_password,
        },
      }),
      inject: [GeneralConfig.KEY],
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
