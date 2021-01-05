import { HttpService, INestApplication } from '@nestjs/common';
import { JobStatusClean, Queue } from 'bull';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Observable, of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { getQueueToken } from '@nestjs/bull';
import * as request from 'supertest';

import { OrdersProcessingModule } from '../src/orders/orders-processing.module';
import { AppModule } from '../src/app.module';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';

function makeMockTigerResponse<T>(data: T): Observable<AxiosResponse<T>> {
  return of({
    headers: {},
    config: { url: '' },
    status: 200,
    statusText: 'OK',
    data: data,
  });
}

function makeMockTigerStatusResponse(
  orderId: string,
  status: 'Pending' | 'New' | 'InProduction' | 'Finished',
) {
  return makeMockTigerResponse({
    OrderID: orderId,
    Reason: 1,
    State: status,
  });
}

function makeMockOrder() {
  return {
    id: 65412,
    fullName: 'Joe Bean',
    email: 'joe@bean.com',
    phone: '+420905149984',
    addressLine1: 'Domažlická 16',
    addressLine2: null,
    company: null,
    zipCode: '13000',
    city: 'Praha',
    country: 'Czechia',
    carrierKey: 'DLH Express',
    status: 'Available',
    details: [
      {
        productId: 51841,
        name: 'Falk Ross white T-Shirt',
        quantity: 2,
        weight: 200,
        eanCode: '1538742254124',
      },
    ],
  };
}

async function runCheckJob(queue: Queue) {
  const [job] = await queue.getJobs(['delayed']);
  await job.promote();
  await job.finished();
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  describe('/api/orders', () => {
    let mockHttpService: HttpService;

    let moduleFixture: TestingModule;
    let ordersRepository: MongoRepository<Order>;
    let queue: Queue;

    beforeAll(async () => {
      mockHttpService = new HttpService();

      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(HttpService)
        .useValue(mockHttpService)
        .compile();

      ordersRepository = moduleFixture.get<MongoRepository<Order>>(
        getRepositoryToken(Order),
      );

      queue = moduleFixture.get<Queue>(getQueueToken('statusChecks'));

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('successful order flow', async () => {
      const mockOrder = makeMockOrder();
      const req = request(app.getHttpServer());

      const tigerHttpServiceGet = jest.spyOn(mockHttpService, 'get');
      const tigerHttpServicePost = jest.spyOn(mockHttpService, 'post');
      const partnerHttpServicePatch = jest.spyOn(mockHttpService, 'patch');

      tigerHttpServiceGet.mockImplementationOnce(() =>
        makeMockTigerStatusResponse(String(mockOrder.id), 'Pending'),
      );
      tigerHttpServiceGet.mockImplementationOnce(() =>
        makeMockTigerStatusResponse(String(mockOrder.id), 'InProduction'),
      );
      tigerHttpServiceGet.mockImplementationOnce(() =>
        makeMockTigerStatusResponse(String(mockOrder.id), 'Finished'),
      );

      tigerHttpServicePost.mockImplementationOnce(() =>
        makeMockTigerResponse(undefined),
      );

      partnerHttpServicePatch.mockImplementationOnce(() =>
        makeMockTigerResponse(undefined),
      );

      await req.post('/api/orders').send(mockOrder);

      const orders = await ordersRepository.find();
      expect(orders.length).toEqual(1);
      expect(orders[0]).toMatchObject({
        status: OrderStatus.new,
        order: expect.objectContaining({
          id: mockOrder.id,
        }),
      });

      expect(tigerHttpServicePost).toHaveBeenCalledTimes(1);
      expect(tigerHttpServicePost).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({ OrderID: String(mockOrder.id) }),
      );

      expect(await queue.count()).toEqual(1);
      await runCheckJob(queue);
      await runCheckJob(queue);
      await runCheckJob(queue);
      expect(await queue.count()).toEqual(0);

      expect(tigerHttpServiceGet).toHaveBeenCalledTimes(3);
      expect(tigerHttpServiceGet).toHaveBeenCalledWith(
        `api/orders/${mockOrder.id}/state`,
      );

      expect(partnerHttpServicePatch).toHaveBeenCalledTimes(1);
      expect(partnerHttpServicePatch).toHaveBeenCalledWith(
        `api/orders/${mockOrder.id}`,
        {
          state: 'finished',
        },
      );
    });

    afterAll(async () => {
      await ordersRepository.clear();
      await Promise.all(
        ([
          'completed',
          'wait',
          'active',
          'delayed',
          'failed',
          'paused',
        ] as JobStatusClean[]).map((status) => queue.clean(0, status)),
      );
      await app.close();
    });
  });

  describe('root', () => {
    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
    afterAll(async () => {
      await app.close();
    });
  });
});
