import {
  Controller,
  Post,
  Body,
  UseGuards,
  SetMetadata,
  HttpCode,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { TokenAuthGuard } from '../../utils/token-auth.guard';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @SetMetadata('tokenKey', 'partner_inc_api_key')
  @UseGuards(TokenAuthGuard)
  @HttpCode(200)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
