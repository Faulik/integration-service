import { HttpService, INestApplication } from '@nestjs/common';
import { JobStatusClean, Queue } from 'bull';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Observable, of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { getQueueToken } from '@nestjs/bull';
import request from 'supertest';
import nock from 'nock';

import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { AppModule } from '../src/app.module';
import { GeneralConfig } from '../src/configuration.providers';
import { ConfigType } from '@nestjs/config';

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
    let generalConfig: ConfigType<typeof GeneralConfig>;

    let moduleFixture: TestingModule;
    let ordersRepository: MongoRepository<Order>;
    let checkQueue: Queue;
    let deliveryQueue: Queue;

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

      generalConfig = moduleFixture.get<ConfigType<typeof GeneralConfig>>(
        GeneralConfig.KEY,
      );

      checkQueue = moduleFixture.get<Queue>(getQueueToken('orderChecks'));
      deliveryQueue = moduleFixture.get<Queue>(getQueueToken('orderDelivery'));

      app = moduleFixture.createNestApplication();
      await app.init();
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
        ] as JobStatusClean[]).flatMap((status) => [
          checkQueue.clean(0, status),
          deliveryQueue.clean(0, status),
        ]),
      );
      await app.close();
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

      await req
        .post('/api/orders')
        .set('x-api-key', generalConfig.partner_inc_api_key)
        .send(mockOrder);

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

      expect(await checkQueue.count()).toEqual(1);
      await runCheckJob(checkQueue);
      await runCheckJob(checkQueue);
      await runCheckJob(checkQueue);
      expect(await checkQueue.count()).toEqual(0);

      expect(tigerHttpServiceGet).toHaveBeenCalledTimes(3);
      expect(tigerHttpServiceGet).toHaveBeenCalledWith(
        `${generalConfig.tiger_api_uri}/api/orders/${mockOrder.id}/state`,
        expect.any(Object),
      );

      await deliveryQueue.whenCurrentJobsFinished();

      expect(partnerHttpServicePatch).toHaveBeenCalledTimes(1);
      expect(partnerHttpServicePatch).toHaveBeenCalledWith(
        `${generalConfig.partner_api_uri}/api/orders/${mockOrder.id}`,
        {
          state: 'finished',
        },
        expect.any(Object),
      );

      const finishedOrders = await ordersRepository.find();
      expect(finishedOrders.length).toEqual(1);

      expect(finishedOrders[0]).toMatchObject({
        status: OrderStatus.delivered,
        order: expect.objectContaining({
          id: mockOrder.id,
        }),
      });
    });
  });

  describe('nocked /api/orders', () => {
    let generalConfig: ConfigType<typeof GeneralConfig>;

    let moduleFixture: TestingModule;
    let ordersRepository: MongoRepository<Order>;
    let checkQueue: Queue;
    let deliveryQueue: Queue;

    beforeAll(async () => {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      ordersRepository = moduleFixture.get<MongoRepository<Order>>(
        getRepositoryToken(Order),
      );

      generalConfig = moduleFixture.get<ConfigType<typeof GeneralConfig>>(
        GeneralConfig.KEY,
      );

      checkQueue = moduleFixture.get<Queue>(getQueueToken('orderChecks'));
      deliveryQueue = moduleFixture.get<Queue>(getQueueToken('orderDelivery'));

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      nock.restore();
      nock.cleanAll();

      await ordersRepository.clear();
      await Promise.all(
        ([
          'completed',
          'wait',
          'active',
          'delayed',
          'failed',
          'paused',
        ] as JobStatusClean[]).flatMap((status) => [
          checkQueue.clean(0, status),
          deliveryQueue.clean(0, status),
        ]),
      );
      await app.close();
    });

    it('successful order flow', async () => {
      const req = request(app.getHttpServer());

      const mockOrder = makeMockOrder();

      const orderStatuses = ['Pending', 'InProduction', 'Finished'];
      const tigerServerScope = nock(generalConfig.tiger_api_uri)
        .post('/api/orders', (body) => body.OrderID === String(mockOrder.id))
        .once()
        .basicAuth({
          user: generalConfig.tiger_api_username,
          pass: generalConfig.tiger_api_password,
        })
        .reply(200)
        .get(/api\/orders\/[0-9]+\/state/)
        .basicAuth({
          user: generalConfig.tiger_api_username,
          pass: generalConfig.tiger_api_password,
        })
        .times(3)
        .reply(200, () => {
          return {
            OrderID: String(mockOrder.id),
            Reason: 1,
            State: orderStatuses.splice(0, 1)[0],
          };
        });

      const partnerServerScope = nock(generalConfig.partner_api_uri)
        .patch(/api\/orders\/[0-9]+/)
        .once()
        .reply(200);

      const response = await req
        .post('/api/orders')
        .set('x-api-key', generalConfig.partner_inc_api_key)
        .send(mockOrder);

      expect(response.status).toEqual(200);

      const orders = await ordersRepository.find();
      expect(orders.length).toEqual(1);
      expect(orders[0]).toMatchObject({
        status: OrderStatus.new,
        order: expect.objectContaining({
          id: mockOrder.id,
        }),
      });
      await deliveryQueue.pause();

      expect(await checkQueue.count()).toEqual(1);
      await runCheckJob(checkQueue);
      await runCheckJob(checkQueue);
      await runCheckJob(checkQueue);
      expect(await checkQueue.count()).toEqual(0);

      expect(await deliveryQueue.count()).toEqual(1);

      expect(tigerServerScope.isDone()).toEqual(true);
      const finishedOrders = await ordersRepository.find();
      expect(finishedOrders.length).toEqual(1);
      expect(finishedOrders[0]).toMatchObject({
        status: OrderStatus.done,
        order: expect.objectContaining({
          id: mockOrder.id,
        }),
      });

      await deliveryQueue.resume();
      expect(await deliveryQueue.count()).toEqual(0);

      await deliveryQueue.whenCurrentJobsFinished();

      expect(partnerServerScope.isDone()).toEqual(true);

      const deliveredOrders = await ordersRepository.find();
      expect(deliveredOrders.length).toEqual(1);
      expect(deliveredOrders[0]).toMatchObject({
        status: OrderStatus.delivered,
        order: expect.objectContaining({
          id: mockOrder.id,
        }),
      });
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
