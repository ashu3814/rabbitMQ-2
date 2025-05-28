// src/common/constants/rabbitmq.constants.ts

// Exchange Constants
export const ECOMMERCE_EVENTS_EXCHANGE = 'ecommerce_events_exchange';
export const SHIPPING_SERVICE_DLX = 'shipping_service_dlx';
export const SHIPPING_SERVICE_RETRY_DLX = 'shipping_service_retry_dlx';

// Client Tokens
export const ORDER_SERVICE_RMQ_CLIENT_TOKEN = 'ORDER_SERVICE_RMQ_CLIENT_TOKEN';
export const PAYMENT_SERVICE_RMQ_CLIENT_TOKEN = 'PAYMENT_SERVICE_RMQ_CLIENT_TOKEN';
export const SHIPPING_SERVICE_RMQ_CLIENT_TOKEN = 'SHIPPING_SERVICE_RMQ_CLIENT_TOKEN';

// Queue Names
export const NOTIFICATION_SERVICE_ORDER_CREATED_QUEUE = 'notification_service_order_created_queue';
export const PAYMENT_SERVICE_ORDER_CREATED_QUEUE = 'payment_service_order_created_queue';
export const INVENTORY_SERVICE_PAYMENT_SUCCESSFUL_QUEUE = 'inventory_service_payment_successful_queue';
export const SHIPPING_SERVICE_QUEUE = 'shipping_service_queue';
export const SHIPPING_SERVICE_RETRY_QUEUE = 'shipping_service_retry_30s_queue';
export const SHIPPING_SERVICE_FINAL_DLQ = 'shipping_service_final_dlq';

// Event Patterns/Routing Keys
export const ORDER_CREATED_EVENT_PATTERN = 'order.created';
export const PAYMENT_PROCESSED_SUCCESSFUL_EVENT_PATTERN = 'payment.processed.successful';
export const PAYMENT_PROCESSED_FAILED_EVENT_PATTERN = 'payment.processed.failed';
export const PAYMENT_PROCESSED_WILDCARD_EVENT_PATTERN = 'payment.processed.*';

// DLX Related Routing Keys
export const SHIPPING_FAILED_ROUTING_KEY = 'shipping.failed';
export const SHIPPING_RETRY_PROCESS_ROUTING_KEY = 'shipping.retry';

// Configuration Constants
export const SHIPPING_MAX_RETRIES = 3;
export const SHIPPING_RETRY_DELAY_MS = 30000; // 30 seconds