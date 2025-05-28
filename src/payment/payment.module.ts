import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  PAYMENT_SERVICE_RMQ_CLIENT_TOKEN,
  ECOMMERCE_EVENTS_EXCHANGE,
  PAYMENT_SERVICE_ORDER_CREATED_QUEUE,
  ORDER_CREATED_EVENT_PATTERN,
} from '../common/constants/rabbitmq.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PAYMENT_SERVICE_RMQ_CLIENT_TOKEN,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'payment_service_order_created_queue',
          queueOptions: {
            durable: true,
          },
          exchange: ECOMMERCE_EVENTS_EXCHANGE,
          exchangeType: 'topic',
        },
      },
    ]),
  ],
  providers: [PaymentService],
})
export class PaymentModule {}
