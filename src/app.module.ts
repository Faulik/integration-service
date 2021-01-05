import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { databaseProviders } from './database.providers';
import { GeoService } from './utils/geo/geo.service';
import { configurationProviders } from './configuration.providers';
import { OrdersProcessingModule } from './orders/orders-processing.module';

@Module({
  imports: [
    ...configurationProviders,
    ...databaseProviders,
    ApiModule,
    OrdersProcessingModule,
  ],
  controllers: [AppController],
  providers: [AppService, GeoService],
})
export class AppModule {}
