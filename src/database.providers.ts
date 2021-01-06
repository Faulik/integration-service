import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigType } from '@nestjs/config';
import {
  configurationProviders,
  GeneralConfig,
} from './configuration.providers';

export const databaseProviders: DynamicModule[] = [
  TypeOrmModule.forRootAsync({
    useFactory: (configService: ConfigType<typeof GeneralConfig>) => ({
      type: 'mongodb',
      url: configService.mongodb_uri,
      autoLoadEntities: true,
      synchronize: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      keepConnectionAlive: true,
    }),
    inject: [GeneralConfig.KEY],
  }),
  BullModule.forRootAsync({
    imports: [...configurationProviders],
    useFactory: async (configService: ConfigType<typeof GeneralConfig>) => ({
      redis: {
        host: configService.redis_host,
        port: configService.redis_port,
        password: configService.redis_password,
      },
    }),
    inject: [GeneralConfig.KEY],
  }),
];
