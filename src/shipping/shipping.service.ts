import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import {
  PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN,
  SHIPPING_MAX_RETRIES,
  SHIPPING_SERVICE_DLX,
  SHIPPING_FAILED_ROUTING_KEY,
} from '../common/constants/rabbitmq.constants';
import { PaymentProcessedEventDto } from '../payment/dto/payment-processed.dto';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  @MessagePattern(PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN)
  async handlePaymentSuccessful(
    @Payload() paymentEvent: PaymentProcessedEventDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    const messageProperties = message.properties;

    // Check if this is a retry attempt by examining x-death header
    const xDeath = messageProperties.headers?.['x-death'] || [];
    const retryCount = xDeath.length > 0 ? xDeath[0].count : 0;

    // Initial message receipt logging
    this.logger.log(`[ShippingService] Message received on Pattern/RoutingKey: ${PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN}`);
    this.logger.log(`[ShippingService] Consuming from Queue: ${message.fields.routingKey}`);
    this.logger.log(`[ShippingService] Source Exchange: ${message.fields.exchange}`);
    this.logger.log(`[ShippingService] CorrelationID: ${paymentEvent.correlationId}`);
    this.logger.log(`[ShippingService] OrderID: ${paymentEvent.orderId}`);
    this.logger.log(`[ShippingService] Retry Count: ${retryCount} of ${SHIPPING_MAX_RETRIES}`);
    this.logger.log(`[ShippingService] Received Payload: ${JSON.stringify(paymentEvent, null, 2)}`);

    // Start processing
    this.logger.log(`[ShippingService] Starting processing for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}, Attempt: ${retryCount + 1}/${SHIPPING_MAX_RETRIES + 1}`);

    try {
      // Simulate external shipping API call
      await this.simulateExternalShippingApiCall(paymentEvent.orderId, retryCount);

      // Pre-ACK logging
      this.logger.log(`[ShippingService] Processing successful for OrderID: ${paymentEvent.orderId}. Preparing to ACK.`);

      // Acknowledge the message on success
      channel.ack(message);

      // Post-ACK logging
      this.logger.log(`[ShippingService] Message ACKed for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
    } catch (error) {
      this.logger.error(
        `[ShippingService] Processing failed for OrderID: ${paymentEvent.orderId}. Reason: ${error.message}. Preparing to handle failure.`,
      );

      if (retryCount >= SHIPPING_MAX_RETRIES) {
        this.logger.error(
          `[ShippingService] Max retries (${SHIPPING_MAX_RETRIES}) reached for OrderID: ${paymentEvent.orderId}. Moving to DLQ.`,
        );
        this.logger.log(`[ShippingService] Preparing to ACK (message will move to final DLQ).`);
        
        // Acknowledge the message to prevent further retries
        channel.ack(message);
        
        this.logger.log(`[ShippingService] Message ACKed and moved to final DLQ for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
      } else {
        // Prepare for retry via DLX
        this.logger.log(`[ShippingService] NACK details - Requeue: false`);
        this.logger.log(`[ShippingService] Message will be dead-lettered to ${SHIPPING_SERVICE_DLX} with routing key ${SHIPPING_FAILED_ROUTING_KEY}`);
        this.logger.log(`[ShippingService] Retry ${retryCount + 1} of ${SHIPPING_MAX_RETRIES} will be attempted for OrderID: ${paymentEvent.orderId}`);
        
        // Negative acknowledge to trigger retry via DLX
        channel.nack(message, false, false);
        
        this.logger.log(`[ShippingService] Message NACKed for retry - OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}, Next attempt will be ${retryCount + 2}/${SHIPPING_MAX_RETRIES + 1}`);
      }

      throw error;
    }
  }

  private async simulateExternalShippingApiCall(orderId: string, retryCount: number): Promise<void> {
    // Simulate an external API call with potential failures
    // Higher chance of success on retries to simulate transient failures
    const successRate = Math.min(0.3 + (retryCount * 0.2), 0.9);
    const isSuccessful = Math.random() < successRate;

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (isSuccessful) {
          this.logger.log(`[ShippingService] External shipping API call successful for OrderID: ${orderId}`);
          resolve(void 0);
        } else {
          reject(new Error('External shipping API temporarily unavailable'));
        }
      }, 500);
    });
  }
}
