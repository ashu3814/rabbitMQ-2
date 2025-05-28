import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Module({
  providers: [ShippingService]
})
export class ShippingModule {}
