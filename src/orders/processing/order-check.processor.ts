import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { TigerOrderService } from '../../tiger/orders/tiger-order.service';
import { PartnerOrdersService } from '../partner/orders/partner-orders.service';
import { OrdersProcessingService } from './orders-processing.service';

@Processor('statusChecks')
export class OrderCheckProcessor {
  constructor(
    @Inject(TigerOrderService) private tigerOrderService: TigerOrderService,
    @Inject(OrdersProcessingService)
    private ordersProcessingService: OrdersProcessingService,
  ) {}

  @Process()
  async transcode(job: Job<{ orderId: string }>) {
    const { data } = await this.tigerOrderService.checkOrderStatus(
      job.data.orderId,
    );

    if (data.State === 'Finished') {
      await job.progress(50);
      this.ordersProcessingService.submitFinishedOrder(job.data.orderId)
    }

    return {};
  }
}
