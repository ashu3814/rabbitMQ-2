// src/order/dto/create-order.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsEmail, IsArray, ValidateNested, IsNumber, Min, IsNotEmpty, IsDefined } from 'class-validator';

class ItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsDefined() // Ensure quantity is provided
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDefined() // Ensure price is provided
  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Customer ID should not be empty' })
  @IsString()
  customerId: string;

  @IsNotEmpty({ message: 'Customer email should not be empty' })
  @IsEmail({}, { message: 'Please provide a valid customer email' })
  customerEmail: string;

  @IsArray()
  @ValidateNested({ each: true }) // Validate each object in the array
  @Type(() => ItemDto) // Important for nested validation to work with class-transformer
  items: ItemDto[];

  @IsDefined({ message: 'Total amount must be provided' })
  @IsNumber({}, { message: 'Total amount must be a number' })
  @Min(0, { message: 'Total amount cannot be negative' })
  totalAmount: number;
}