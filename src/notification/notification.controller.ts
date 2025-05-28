// src/notification/notification.controller.ts
import { Controller } from '@nestjs/common';
// import { NotificationService } from './notification.service'; // Not strictly needed if no HTTP routes

@Controller('notification') // This controller won't have routes for Phase 1
export class NotificationController {
  // constructor(private readonly notificationService: NotificationService) {} // Not needed yet
}