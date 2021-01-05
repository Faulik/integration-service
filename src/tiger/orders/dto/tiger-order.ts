import {
  IsString,
  IsEmail,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsISO31661Alpha2,
} from 'class-validator';

class TigerOrderShippingDeliveryAddress {
  @IsString()
  AddressLine1: string; // required

  @IsString({ always: false })
  AddressLine2: string; // optional

  @IsString()
  City: string; // required

  @IsString({ always: false })
  Company: string; // optional

  @IsString()
  @IsISO31661Alpha2()
  CountryCode: string; // required; ISO 3166-1 alpha-2;

  @IsEmail()
  Email: string; // required

  @IsString()
  PersonName: string; // required

  @IsString()
  Phone: string; // required

  @IsString()
  State: string; // required

  @IsString()
  Zip: string; // required
}

class TigerOrderShipping {
  @IsNumber()
  CarrierID: number; // required; mapped from carriers list

  @ValidateNested()
  DeliveryAddress: TigerOrderShippingDeliveryAddress;
}

class TigerOrderProduct {
  @IsString()
  Barcode: string; // required, EAN code

  @IsString()
  OPTProductID: string; // required, EAN code

  @IsNumber()
  Qty: number; // required
}

export class TigerOrderDto {
  @IsString()
  'OrderID': string; // required

  @IsBoolean()
  'InvoiceSendLater': boolean;

  @IsDateString()
  'Issued': string; // required; ISO 8601 date-time format

  @IsString()
  'OrderType': string; // allways "standard";

  @ValidateNested()
  'Shipping': TigerOrderShipping;

  @IsArray()
  @ValidateNested()
  'Products': TigerOrderProduct[];
}
