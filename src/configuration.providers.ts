import { DynamicModule } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import * as Joi from '@hapi/joi';

export const GeneralConfig = registerAs('general', () => ({
  node_env: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI,
  redis_host: process.env.REDIS_HOST,
  redis_port: parseInt(process.env.REDIS_PORT, 10),
  redis_password: process.env.REDIS_PASSWORD,

  partner_api_uri: process.env.PARTNER_API_URI,
  partner_inc_api_key: process.env.PARTNER_INC_API_KEY,
  partner_out_api_key: process.env.PARTNER_OUT_API_KEY,

  tiger_api_uri: process.env.TIGER_API_URI,
  tiger_api_username: process.env.TIGER_API_USERNAME,
  tiger_api_password: process.env.TIGER_API_PASSWORD,
}));

export const configurationProviders: DynamicModule[] = [
  ConfigModule.forRoot({
    isGlobal: true,
    load: [GeneralConfig],
    validationSchema: Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      MONGODB_URI: Joi.string().default('mongodb://localhost:27027/dev'),
      REDIS_HOST: Joi.string().default('localhost'),
      REDIS_PORT: Joi.number().default('6389'),
      REDIS_PASSWORD: Joi.string(),
      PARTNER_API_URI: Joi.string(),
      TIGER_API_URI: Joi.string(),
      PARTNER_INC_API_KEY: Joi.string(),
      PARTNER_OUT_API_KEY: Joi.string(),
      TIGER_API_USERNAME: Joi.string(),
      TIGER_API_PASSWORD: Joi.string(),
    }),
  }),
];
