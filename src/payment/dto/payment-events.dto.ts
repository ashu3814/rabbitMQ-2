import { IsString, IsNumber, IsEnum, IsUUID, IsDateString } from 'class-validator';

export enum PaymentStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export class PaymentProcessedEventPayload {
  @IsUUID()
  orderId: string;

  @IsUUID()
  correlationId: string;

  @IsUUID()
  paymentId: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsNumber()
  amountProcessed: number;

  @IsString()
  reason?: string;

  @IsDateString()
  timestamp: string;
} 