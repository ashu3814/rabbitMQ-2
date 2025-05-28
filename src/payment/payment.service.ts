import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import {
  PAYMENT_SERVICE_RMQ_CLIENT_TOKEN,
  ORDER_CREATED_EVENT_PATTERN,
  PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
  PAYMENT_PROCESSED_FAILED_EVENT_PATTERN,
  ECOMMERCE_EVENTS_EXCHANGE,
} from '../common/constants/rabbitmq.constants';
import { OrderCreatedEventPayload } from '../order/order.service';
import { PaymentProcessedEventDto, PaymentStatus } from './dto/payment-processed.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(PAYMENT_SERVICE_RMQ_CLIENT_TOKEN)
    private readonly client: ClientProxy,
  ) {}

  @MessagePattern(ORDER_CREATED_EVENT_PATTERN)
  async handleOrderCreated(
    @Payload() orderPayload: OrderCreatedEventPayload,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    
    // Initial message receipt logging
    this.logger.log(`[PaymentService] Message received on Pattern/RoutingKey: ${ORDER_CREATED_EVENT_PATTERN}`);
    this.logger.log(`[PaymentService] Consuming from Queue: ${message.fields.routingKey}`);
    this.logger.log(`[PaymentService] Source Exchange: ${message.fields.exchange}`);
    this.logger.log(`[PaymentService] CorrelationID: ${orderPayload.correlationId}`);
    this.logger.log(`[PaymentService] OrderID: ${orderPayload.orderId}`);
    this.logger.log(`[PaymentService] Received Payload: ${JSON.stringify(orderPayload, null, 2)}`);

    // Start processing
    this.logger.log(`[PaymentService] Starting processing for OrderID: ${orderPayload.orderId}, CorrelationID: ${orderPayload.correlationId}`);

    try {
      // Simulate payment processing with 80% success rate
      const isSuccessful = Math.random() < 0.8;
      const paymentId = `PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      // Create payment event payload
      const paymentEventPayload: PaymentProcessedEventDto = {
        orderId: orderPayload.orderId,
        amount: orderPayload.totalAmount,
        status: isSuccessful ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED,
        correlationId: orderPayload.correlationId,
        timestamp: new Date().toISOString(),
        paymentId,
        items: orderPayload.items.map(item => item.productId),
      };

      const routingKey = isSuccessful
        ? PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN
        : PAYMENT_PROCESSED_FAILED_EVENT_PATTERN;

      // Pre-emit logging
      this.logger.log(`[PaymentService] Preparing to publish event`);
      this.logger.log(`[PaymentService] Target Exchange: ${ECOMMERCE_EVENTS_EXCHANGE}`);
      this.logger.log(`[PaymentService] Routing Key: ${routingKey}`);
      this.logger.log(`[PaymentService] CorrelationID: ${orderPayload.correlationId}`);
      this.logger.log(`[PaymentService] OrderID: ${orderPayload.orderId}`);
      this.logger.log(`[PaymentService] Publishing Payload: ${JSON.stringify(paymentEventPayload, null, 2)}`);

      // Emit the payment processed event
      await this.client.emit(routingKey, paymentEventPayload).toPromise();
      
      this.logger.log(`[PaymentService] Event publishing initiated for OrderID: ${orderPayload.orderId}, CorrelationID: ${orderPayload.correlationId}`);

      // Pre-ACK logging
      this.logger.log(`[PaymentService] Processing successful for OrderID: ${orderPayload.orderId}. Preparing to ACK.`);
      
      // Acknowledge the original message
      channel.ack(message);

      // Post-ACK logging
      this.logger.log(`[PaymentService] Message ACKed for OrderID: ${orderPayload.orderId}, CorrelationID: ${orderPayload.correlationId}`);
    } catch (error) {
      this.logger.error(
        `[PaymentService] Processing failed for OrderID: ${orderPayload.orderId}. Reason: ${error.message}. Preparing to NACK.`,
      );
      this.logger.log(`[PaymentService] NACK details - Requeue: false`);

      // Negative acknowledge the message without requeue
      channel.nack(message, false, false);

      this.logger.log(`[PaymentService] Message NACKed for OrderID: ${orderPayload.orderId}, CorrelationID: ${orderPayload.correlationId}`);
      throw error;
    }
  }
}
