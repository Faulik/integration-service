import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { MongoRepository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TigerOrderService } from '../../tiger/orders/tiger-order.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: MongoRepository<Order>,
    @Inject(TigerOrderService)
    private tigerOrderService: TigerOrderService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { result } = await this.ordersRepository.insertOne({
      status: OrderStatus.new,
      order: createOrderDto,
    });

    if (result.ok) {
      await this.tigerOrderService.create(createOrderDto);
    }

    return result.ok;
  }
}
