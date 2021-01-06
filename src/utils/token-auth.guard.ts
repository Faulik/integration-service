import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { GeneralConfig } from '../configuration.providers';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    @Inject(GeneralConfig.KEY)
    private generalConfig: ConfigType<typeof GeneralConfig>,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const tokenKey = this.reflector.get<string>(
      'tokenKey',
      context.getHandler(),
    );
    if (!tokenKey) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['x-api-key'];

    return authHeader === this.generalConfig[tokenKey];
  }
}
