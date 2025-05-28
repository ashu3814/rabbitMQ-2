// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ORDER_SERVICE_RMQ_CLIENT_TOKEN,
  ECOMMERCE_EVENTS_EXCHANGE,
  ORDER_CREATED_EVENT_PATTERN,
} from '../common/constants/rabbitmq.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORDER_SERVICE_RMQ_CLIENT_TOKEN,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          exchange: ECOMMERCE_EVENTS_EXCHANGE,
          exchangeType: 'topic',
          // routingKey: ORDER_CREATED_EVENT_PATTERN,
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}