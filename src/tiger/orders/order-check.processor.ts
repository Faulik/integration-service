import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { TigerOrderService } from './tiger-order.service';

@Processor('statusChecks')
export class OrderCheckProcessor {
  constructor(
    @Inject(TigerOrderService) private tigerOrderService: TigerOrderService,
  ) {}

  @Process()
  async transcode(job: Job<{ orderId: string }>) {
    const { data } = await this.tigerOrderService.checkOrderStatus(
      job.data.orderId,
    );

    console.log(data);
    if (data.State === 'Finished') {
      await job.progress(50);
      await job.queue.removeRepeatable({
        every: 1000 * 60 * 2,
        jobId: `tiger_order_${job.data.orderId}`,
      });
    }

    return {};
  }
}
