// src/order/order.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, Logger, UsePipes } from '@nestjs/common';
import { OrderService, OrderCreatedEventPayload } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  // The ValidationPipe will be applied by the global pipe in main.ts
  // If not using global pipe, you'd add @UsePipes here or on @Body
  async createOrder(
    @Body() orderData: CreateOrderDto, // Type is critical
  ): Promise<{ message: string; eventDetails: OrderCreatedEventPayload }> {
    // Initial request logging
    this.logger.log('[OrderController] Received HTTP POST request to /orders');
    this.logger.log(`[OrderController] Customer ID: ${orderData.customerId}`);
    this.logger.log(`[OrderController] Customer Email: ${orderData.customerEmail}`);
    this.logger.log(`[OrderController] Order Items Count: ${orderData.items.length}`);
    this.logger.log(`[OrderController] Total Amount: ${orderData.totalAmount}`);
    this.logger.log(`[OrderController] Request Payload: ${JSON.stringify(orderData, null, 2)}`);

    // Process order
    this.logger.log('[OrderController] Initiating order creation process');
    const createdOrderEvent = await this.orderService.createOrder(orderData);

    // Response logging
    this.logger.log(`[OrderController] Order creation initiated successfully`);
    this.logger.log(`[OrderController] Generated Order ID: ${createdOrderEvent.orderId}`);
    this.logger.log(`[OrderController] Correlation ID: ${createdOrderEvent.correlationId}`);
    this.logger.log(`[OrderController] Timestamp: ${createdOrderEvent.timestamp}`);
    this.logger.log('[OrderController] Sending HTTP 202 Accepted response');

    return {
      message: 'Order creation initiated. Event published to RabbitMQ.',
      eventDetails: createdOrderEvent,
    };
  }
}