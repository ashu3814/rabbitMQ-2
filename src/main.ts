// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {  Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common'; // Import ValidationPipe
import * as amqp from 'amqplib';
import {
  ECOMMERCE_EVENTS_EXCHANGE,
  NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE,
  ORDER_CREATED_EVENT_PATTERN,
  PAYMENT_SERVICE_ORDER_CREATED_QUEUE,
  INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE,
  SHIPPING_SERVICE_QUEUE,
  SHIPPING_SERVICE_RETRY_QUEUE,
  SHIPPING_SERVICE_FINAL_DLQ,
  PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
  PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN,
  SHIPPING_SERVICE_DLX,
  SHIPPING_SERVICE_RETRY_DLX,
  SHIPPING_RETRY_PROCESS_ROUTING_KEY,
  SHIPPING_FAILED_ROUTING_KEY,
  SHIPPING_RETRY_DELAY_MS,
} from './common/constants/rabbitmq.constants';

async function bootstrap() {
  const appName = 'ECommerceFlowDemo';
  const logger = new Logger(appName);

  const app = await NestFactory.create(AppModule);

  // Setup a GLOBAL ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that are not defined in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allows auto-conversion of primitive types
      },
    }),
  );

  // Create and configure exchanges and queues
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  // Declare main exchange first
  await channel.assertExchange(ECOMMERCE_EVENTS_EXCHANGE, 'topic', { durable: true });

  // Declare DLX exchanges
  await channel.assertExchange(SHIPPING_SERVICE_DLX, 'direct', { durable: true });
  await channel.assertExchange(SHIPPING_SERVICE_RETRY_DLX, 'direct', { durable: true });

  // Declare all queues
  await channel.assertQueue(NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(PAYMENT_SERVICE_ORDER_CREATED_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(SHIPPING_SERVICE_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': SHIPPING_SERVICE_DLX,
      'x-dead-letter-routing-key': SHIPPING_FAILED_ROUTING_KEY,
    },
  });

  // Declare retry queue with TTL
  await channel.assertQueue(SHIPPING_SERVICE_RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': SHIPPING_SERVICE_RETRY_DLX,
      'x-dead-letter-routing-key': SHIPPING_RETRY_PROCESS_ROUTING_KEY,
      'x-message-ttl': SHIPPING_RETRY_DELAY_MS,
    },
  });

  // Declare final DLQ
  await channel.assertQueue(SHIPPING_SERVICE_FINAL_DLQ, {
    durable: true,
  });

  // Bind queues to exchanges
  await channel.bindQueue(
    NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE,
    ECOMMERCE_EVENTS_EXCHANGE,
    ORDER_CREATED_EVENT_PATTERN,
  );
  await channel.bindQueue(
    NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE,
    ECOMMERCE_EVENTS_EXCHANGE,
    PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN,
  );
  await channel.bindQueue(
    PAYMENT_SERVICE_ORDER_CREATED_QUEUE,
    ECOMMERCE_EVENTS_EXCHANGE,
    ORDER_CREATED_EVENT_PATTERN,
  );
  await channel.bindQueue(
    INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE,
    ECOMMERCE_EVENTS_EXCHANGE,
    PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
  );
  await channel.bindQueue(
    SHIPPING_SERVICE_QUEUE,
    ECOMMERCE_EVENTS_EXCHANGE,
    PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
  );

  // Bind retry queues
  await channel.bindQueue(
    SHIPPING_SERVICE_RETRY_QUEUE,
    SHIPPING_SERVICE_DLX,
    SHIPPING_FAILED_ROUTING_KEY,
  );
  await channel.bindQueue(
    SHIPPING_SERVICE_QUEUE,
    SHIPPING_SERVICE_RETRY_DLX,
    SHIPPING_RETRY_PROCESS_ROUTING_KEY,
  );

  // Configure RabbitMQ microservice connections
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE,
      queueOptions: {
        durable: true,
      },
      exchange: ECOMMERCE_EVENTS_EXCHANGE,
      exchangeType: 'topic',
      noAck: false,
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: PAYMENT_SERVICE_ORDER_CREATED_QUEUE,
      queueOptions: {
        durable: true,
      },
      exchange: ECOMMERCE_EVENTS_EXCHANGE,
      exchangeType: 'topic',
      noAck: false,
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE,
      queueOptions: {
        durable: true,
      },
      exchange: ECOMMERCE_EVENTS_EXCHANGE,
      exchangeType: 'topic',
      noAck: false,
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: SHIPPING_SERVICE_QUEUE,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': SHIPPING_SERVICE_DLX,
          'x-dead-letter-routing-key': SHIPPING_FAILED_ROUTING_KEY,
        },
      },
      exchange: ECOMMERCE_EVENTS_EXCHANGE,
      exchangeType: 'topic',
      noAck: false,
    },
  });

  // Close the channel and connection after setup
  await channel.close();
  await connection.close();

  await app.startAllMicroservices();
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 HTTP server ${appName} running on port ${port}`);
  logger.log(`🎧 Microservice ${appName} listening on RabbitMQ queues:`);
  logger.log(`  - Notifications (Orders): ${NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE}`);
  logger.log(`  - Notifications (Payments): ${NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE}_payment_events`);
  logger.log(`  - Payments: ${PAYMENT_SERVICE_ORDER_CREATED_QUEUE}`);
  logger.log(`  - Inventory: ${INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE}`);
}
bootstrap();