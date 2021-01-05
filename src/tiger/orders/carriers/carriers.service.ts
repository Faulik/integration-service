import { Injectable } from '@nestjs/common';

const CARRIERS_MAP = {
  DPD: 1001,
  DHL: 1002,
  'DHL Express': 1003,
  UPS: 1004,
  GLS: 1005,
};

@Injectable()
export class CarriersService {
  getCarrierId(name: string) {
    return CARRIERS_MAP[name] || null;
  }
}
