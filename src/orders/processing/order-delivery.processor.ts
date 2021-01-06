import { Processor, Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';

import { OrdersProcessingService } from './orders-processing.service';

@Processor('orderDelivery')
export class OrderDeliveryProcessor {
  constructor(
    @Inject(OrdersProcessingService)
    private ordersProcessingService: OrdersProcessingService,
  ) {}

  @Process()
  async transcode(job: Job<{ orderId: string }>) {
    await this.ordersProcessingService.submitDeliveredOrder(job.data.orderId);

    return {};
  }
}
