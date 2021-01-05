import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigType } from '@nestjs/config';
import { generalConfig } from './configuration.providers';

export const databaseProviders: DynamicModule[] = [
  TypeOrmModule.forRootAsync({
    useFactory: (configService: ConfigType<typeof generalConfig>) => ({
      type: 'mongodb',
      url: configService.mongodb_uri,
      autoLoadEntities: true,
      synchronize: true,
    }),
    inject: [generalConfig.KEY],
  }),
  BullModule.forRootAsync({
    useFactory: async (configService: ConfigType<typeof generalConfig>) => ({
      redis: {
        host: configService.redis_host,
        port: configService.redis_port,
      },
    }),
    inject: [generalConfig.KEY],
  }),
];
