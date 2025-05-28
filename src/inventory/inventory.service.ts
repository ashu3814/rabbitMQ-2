import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN } from '../common/constants/rabbitmq.constants';
import { PaymentProcessedEventDto } from '../payment/dto/payment-processed.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  @MessagePattern(PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN)
  async handlePaymentSuccessful(
    @Payload() paymentEvent: PaymentProcessedEventDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    // Initial message receipt logging
    this.logger.log(`[InventoryService] Message received on Pattern/RoutingKey: ${PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN}`);
    this.logger.log(`[InventoryService] Consuming from Queue: ${message.fields.routingKey}`);
    this.logger.log(`[InventoryService] Source Exchange: ${message.fields.exchange}`);
    this.logger.log(`[InventoryService] CorrelationID: ${paymentEvent.correlationId}`);
    this.logger.log(`[InventoryService] OrderID: ${paymentEvent.orderId}`);
    this.logger.log(`[InventoryService] Received Payload: ${JSON.stringify(paymentEvent, null, 2)}`);

    // Start processing
    this.logger.log(`[InventoryService] Starting processing for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);

    try {
      // Simulate inventory update
      await this.simulateInventoryUpdate(paymentEvent.items);

      // Pre-ACK logging
      this.logger.log(`[InventoryService] Processing successful for OrderID: ${paymentEvent.orderId}. Preparing to ACK.`);

      // Acknowledge the message
      channel.ack(message);

      // Post-ACK logging
      this.logger.log(`[InventoryService] Message ACKed for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
    } catch (error) {
      this.logger.error(
        `[InventoryService] Processing failed for OrderID: ${paymentEvent.orderId}. Reason: ${error.message}. Preparing to NACK.`,
      );
      this.logger.log(`[InventoryService] NACK details - Requeue: false`);

      // Negative acknowledge without requeue
      channel.nack(message, false, false);

      this.logger.log(`[InventoryService] Message NACKed for OrderID: ${paymentEvent.orderId}, CorrelationID: ${paymentEvent.correlationId}`);
      throw error;
    }
  }

  private async simulateInventoryUpdate(items: string[]): Promise<void> {
    // Simulate a database operation with a small delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.logger.log(`[InventoryService] Updated inventory for items: ${items.join(', ')}`);
  }
}
