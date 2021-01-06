import { Processor, Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';

import { OrdersProcessingService } from './orders-processing.service';

@Processor('orderChecks')
export class OrderCheckProcessor {
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
}
