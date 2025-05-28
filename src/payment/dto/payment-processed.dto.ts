import { IsString, IsEnum, IsNumber, IsUUID, IsISO8601 } from 'class-validator';

export enum PaymentStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export class PaymentProcessedEventDto {
  @IsString()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsUUID()
  correlationId: string;

  @IsISO8601()
  timestamp: string;

  @IsString()
  paymentId: string;

  @IsString({ each: true })
  items: string[];
} 