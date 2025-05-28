// src/order/order.service.ts
import { Inject, Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ECOMMERCE_EVENTS_EXCHANGE,
  ORDER_CREATED_EVENT_PATTERN,
  ORDER_SERVICE_RMQ_CLIENT_TOKEN,
} from '../common/constants/rabbitmq.constants';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto'; // Import the DTO

// Payload for the RabbitMQ event
export interface OrderCreatedEventPayload extends CreateOrderDto {
  orderId: string;
  correlationId: string;
  timestamp: string;
}

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject(ORDER_SERVICE_RMQ_CLIENT_TOKEN) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('[OrderService] RabbitMQ client connected successfully.');
    } catch (err) {
      this.logger.error('[OrderService] Failed to connect RabbitMQ client:', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('[OrderService] RabbitMQ client connection closed.');
    }
  }

  async createOrder(orderData: CreateOrderDto): Promise<OrderCreatedEventPayload> {
    // Generate unique identifiers
    const orderId = `ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const correlationId = uuidv4();
    const timestamp = new Date().toISOString();

    // Create event payload
    const eventPayload: OrderCreatedEventPayload = {
      ...orderData,
      orderId,
      correlationId,
      timestamp,
    };

    // Pre-emit logging
    this.logger.log('[OrderService] Preparing to publish event');
    this.logger.log(`[OrderService] Target Exchange: ${ECOMMERCE_EVENTS_EXCHANGE}`);
    this.logger.log(`[OrderService] Routing Key: ${ORDER_CREATED_EVENT_PATTERN}`);
    this.logger.log(`[OrderService] CorrelationID: ${correlationId}`);
    this.logger.log(`[OrderService] OrderID: ${orderId}`);
    this.logger.log(`[OrderService] Publishing Payload: ${JSON.stringify(eventPayload, null, 2)}`);

    // Emit the event
    await this.client.emit<string, OrderCreatedEventPayload>(
      ORDER_CREATED_EVENT_PATTERN,
      eventPayload,
    ).toPromise();

    // Post-emit logging
    this.logger.log(`[OrderService] Event publishing initiated for OrderID: ${orderId}, CorrelationID: ${correlationId}`);
    this.logger.log(`[OrderService] Order flow initiated with following services:`);
    this.logger.log(`[OrderService] 1. Notification Service - Will send order confirmation`);
    this.logger.log(`[OrderService] 2. Payment Service - Will process payment`);
    this.logger.log(`[OrderService] 3. Payment Success → Inventory Service - Will update stock`);
    this.logger.log(`[OrderService] 4. Payment Success → Shipping Service - Will create shipment (with retry mechanism)`);

    return eventPayload;
  }
}