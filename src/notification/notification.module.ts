// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller'; // Optional if no HTTP routes

@Module({
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}