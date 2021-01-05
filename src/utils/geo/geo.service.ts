import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoService {
  getCityAndState(_args: { city: string; country: string; zipCode: string }) {
    return {
      state: 'test',
      countryCode: 'us',
    };
  }
}
