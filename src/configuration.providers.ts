import { DynamicModule } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import * as Joi from '@hapi/joi';

export const generalConfig = registerAs('general', () => ({
  node_env: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI,
  redis_host: process.env.REDIS_HOST,
  redis_port: parseInt(process.env.REDIS_PORT, 10),

  partner_api_uri: process.env.PARTNER_API_URI,
  tiger_api_uri: process.env.TIGER_API_URI,
}));

export const configurationProviders: DynamicModule[] = [
  ConfigModule.forRoot({
    isGlobal: true,
    load: [generalConfig],
    validationSchema: Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      MONGODB_URI: Joi.string(),
      REDIS_HOST: Joi.string(),
      REDIS_PORT: Joi.number(),
      PARTNER_API_URI: Joi.string(),
      TIGER_API_URI: Joi.string(),
    }),
  }),
];
