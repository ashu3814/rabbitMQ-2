export type PaymentStatus = 'SUCCESSFUL' | 'FAILED';

export interface PaymentProcessedEventPayload {
  orderId: string;
  correlationId: string;
  paymentId: string;
  status: PaymentStatus;
  amountProcessed?: number;  // Only present if status is SUCCESSFUL
  reason?: string;          // Only present if status is FAILED
  timestamp: Date;
} 