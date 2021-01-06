import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';

import { OrdersProcessingService } from './orders-processing.service';

@Processor('orderChecks')
export class OrderCheckProcessor {
  private readonly logger = new Logger(OrderCheckProcessor.name);

  constructor(
    @Inject(OrdersProcessingService)
    private ordersProcessingService: OrdersProcessingService,
  ) {}

  @Process()
  async transcode(job: Job<{ orderId: string }>) {
    const data = await this.ordersProcessingService.checkOrderStatus(
      job.data.orderId,
    );

    if (data.State === 'Finished') {
      await job.progress(50);
      await this.ordersProcessingService.submitFinishedOrder(job.data.orderId);
    }

    return {};
  }

  @OnQueueFailed()
  handleFail(job, err) {
    this.logger.error(err);
  }
}
