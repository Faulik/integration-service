import { Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

import { CarriersService } from './carriers/carriers.service';
import { CreateOrderDto } from '../../api/orders/dto/create-order.dto';
import { TigerOrderDto } from './dto/tiger-order';
import { GeoService } from '../../utils/geo/geo.service';

// Not sure how to make as a pipe in a sane way
@Injectable()
export class TransformOrderService {
  constructor(
    @Inject(CarriersService) private carriersService: CarriersService,
    @Inject(GeoService) private geoService: GeoService,
  ) {}

  async transform(value: CreateOrderDto): Promise<TigerOrderDto> {
    const geoData = this.geoService.getCityAndState({
      city: value.city,
      country: value.country,
      zipCode: value.zipCode,
    });

    const baseTransformed: TigerOrderDto = {
      OrderID: String(value.id), // required
      InvoiceSendLater: false, // allways false
      Issued: new Date().toISOString(), // required, ISO 8601 date-time format
      OrderType: 'standard', // allways "standard",
      Shipping: {
        CarrierID: this.carriersService.getCarrierId(value.carrierKey), // required, mapped from carriers list
        DeliveryAddress: {
          AddressLine1: value.addressLine1, // required
          AddressLine2: value.addressLine2, // optional
          City: value.city, // required
          Company: value.company, // optional
          CountryCode: geoData.countryCode, // required, ISO 3166-1 alpha-2,
          Email: value.email, // required
          PersonName: value.fullName, // required
          Phone: value.phone, // required
          State: geoData.state, // required
          Zip: value.zipCode, // required
        },
      },
      Products: [
        {
          Barcode: value.details[0].eanCode, // required, EAN code
          OPTProductID: value.details[0].eanCode, // required, EAN code
          Qty: value.details[0].quantity, // required
        },
      ],
    };

    const transformed = plainToClass(TigerOrderDto, baseTransformed);

    const errors = await validate(transformed);
    if (errors.length > 0) {
      throw new Error('Tiger Order Transformation Failed');
    }

    return transformed;
  }
}
