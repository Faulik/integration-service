import {
  IsMobilePhone,
  IsString,
  IsEmail,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDtoDetails {
  @IsNumber()
  @ApiProperty()
  productId: number;
  @IsString()
  @ApiProperty()
  name: string;
  @IsNumber()
  @ApiProperty()
  quantity: number;
  @IsNumber()
  @ApiProperty()
  weight: number;

  @IsString()
  @ApiProperty()
  eanCode: string;
}

export class CreateOrderDto {
  @IsNumber()
  @ApiProperty()
  'id': number;

  @IsString()
  @ApiProperty()
  'fullName': string;

  @IsEmail()
  @ApiProperty()
  'email': string;

  @IsMobilePhone()
  @ApiProperty()
  'phone': string;

  @IsString()
  @ApiProperty()
  'addressLine1': string;

  @IsString()
  @ApiProperty()
  'addressLine2': string;

  @IsString()
  @ApiProperty()
  'company': string;

  @IsString()
  @ApiProperty()
  'zipCode': string;

  @IsString()
  @ApiProperty()
  'city': string;

  @IsString()
  @ApiProperty()
  'country': string;

  @IsString()
  @ApiProperty()
  'carrierKey': string;

  @IsString()
  @ApiProperty()
  'status': string;

  @IsArray()
  @ValidateNested()
  @ApiProperty()
  'details': CreateOrderDtoDetails[];
}
