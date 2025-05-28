import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ECOMMERCE_EVENTS_EXCHANGE,
  INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE,
  PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
} from '../common/constants/rabbitmq.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',  // We don't need a token constant since this service only consumes
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          exchange: ECOMMERCE_EVENTS_EXCHANGE,
          exchangeType: 'topic',
          queue: INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [InventoryService],
})
export class InventoryModule {} 