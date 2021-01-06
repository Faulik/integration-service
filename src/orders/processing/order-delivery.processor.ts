import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';

import { OrdersProcessingService } from './orders-processing.service';

@Processor('orderDelivery')
export class OrderDeliveryProcessor {
  private readonly logger = new Logger(OrderDeliveryProcessor.name);

  constructor(
    @Inject(OrdersProcessingService)
    private ordersProcessingService: OrdersProcessingService,
  ) {}

  @Process()
  async transcode(job: Job<{ orderId: string }>) {
    await this.ordersProcessingService.submitDeliveredOrder(job.data.orderId);

    return {};
  }

  @OnQueueFailed()
  handleFail(job, err) {
    this.logger.error(err);
  }
}
