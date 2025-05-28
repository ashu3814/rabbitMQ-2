// src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RmqContext, Ctx } from '@nestjs/microservices';
import { 
  ORDER_CREATED_EVENT_PATTERN,
  PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN,
  ECOMMERCE_EVENTS_EXCHANGE,
} from '../common/constants/rabbitmq.constants';
import { OrderCreatedEventPayload } from '../order/order.service';
import { PaymentProcessedEventDto, PaymentStatus } from '../payment/dto/payment-processed.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  @MessagePattern(ORDER_CREATED_EVENT_PATTERN)
  async handleOrderCreated(@Payload() orderEvent: OrderCreatedEventPayload, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    // Initial message receipt logging
    this.logger.log(`[NotificationService] Message received on Pattern/RoutingKey: ${ORDER_CREATED_EVENT_PATTERN}`);
    this.logger.log(`[NotificationService] Consuming from Queue: ${message.fields.routingKey}`);
    this.logger.log(`[NotificationService] Source Exchange: ${message.fields.exchange}`);
    this.logger.log(`[NotificationService] CorrelationID: ${orderEvent.correlationId}`);
    this.logger.log(`[NotificationService] OrderID: ${orderEvent.orderId}`);
    this.logger.log(`[NotificationService] Received Payload: ${JSON.stringify(orderEvent, null, 2)}`);

    // Start processing
    this.logger.log(`[NotificationService] Starting processing for OrderID: ${orderEvent.orderId}, CorrelationID: ${orderEvent.correlationId}`);

    try {
      // In a real application, we would get the customer's email from the order data
      await this.simulateSendEmail(
        'customer@example.com',
        'Order Received',
        `Thank you for your order ${orderEvent.orderId}! We are processing your payment.`,
      );

      // Pre-ACK logging
      this.logger.log(`[NotificationService] Processing successful for OrderID: ${orderEvent.orderId}. Preparing to ACK.`);

      // Acknowledge the message
      channel.ack(message);

      // Post-ACK logging
      this.logger.log(`[NotificationService] Message ACKed for OrderID: ${orderEvent.orderId}, CorrelationID: ${orderEvent.correlationId}`);
    } catch (error) {
      this.logger.error(
        `[NotificationService] Processing failed for OrderID: ${orderEvent.orderId}. Reason: ${error.message}. Preparing to NACK.`,
      );
      this.logger.log(`[NotificationService] NACK details - Requeue: false`);

      // Negative acknowledge without requeue
      channel.nack(message, false, false);

      this.logger.log(`[NotificationService] Message NACKed for OrderID: ${orderEvent.orderId}, CorrelationID: ${orderEvent.correlationId}`);
      throw error;
    }
  }

  @MessagePattern(PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN)
  async handlePaymentProcessed(
    @Payload() paymentEvent: PaymentProcessedEventDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    // Initial message receipt logging
    this.logger.log(`[NotificationService] Message received on Pattern/RoutingKey: ${PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN}`);
    this.logger.log(`[NotificationService] Consuming from Queue: ${message.fields.routingKey}`);
    this.logger.log(`[NotificationService] Source Exchange: ${message.fields.exchange}`);
    this.logger.log(`[NotificationService] CorrelationID: ${paymentEvent.correlationId}`);
    this.logger.log(`[NotificationService] OrderID: ${paymentEvent.orderId}`);
    this.logger.log(`[NotificationService] Received Payload: ${JSON.stringify(paymentEvent, null, 2)}`);

    // Start processing
    this.logger.log(`[NotificationService] Starting processing for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);

    try {
      const subject =
        paymentEvent.status === PaymentStatus.SUCCESSFUL
          ? 'Payment Successful'
          : 'Payment Failed';

      const message =
        paymentEvent.status === PaymentStatus.SUCCESSFUL
          ? `Your payment for order ${paymentEvent.orderId} was successful. We'll start processing your order right away!`
          : `Unfortunately, your payment for order ${paymentEvent.orderId} failed. Please try again with a different payment method.`;

      // In a real application, we would get the customer's email from a database
      await this.simulateSendEmail('customer@example.com', subject, message);

      // Pre-ACK logging
      this.logger.log(`[NotificationService] Processing successful for OrderID: ${paymentEvent.orderId}. Preparing to ACK.`);

      // Acknowledge the message
      channel.ack(message);

      // Post-ACK logging
      this.logger.log(`[NotificationService] Message ACKed for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
    } catch (error) {
      this.logger.error(
        `[NotificationService] Processing failed for OrderID: ${paymentEvent.orderId}. Reason: ${error.message}. Preparing to NACK.`,
      );
      this.logger.log(`[NotificationService] NACK details - Requeue: false`);

      // Negative acknowledge without requeue
      channel.nack(message, false, false);

      this.logger.log(`[NotificationService] Message NACKed for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
      throw error;
    }
  }

  private async simulateSendEmail(to: string, subject: string, content: string): Promise<void> {
    // Simulate email sending with a small delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.logger.log(`[NotificationService] Email sent - To: ${to}, Subject: ${subject}`);
  }
}