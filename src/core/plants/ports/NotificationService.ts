export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationService {
  subscribe(deviceId: string, subscription: PushSubscriptionData): Promise<void>
  unsubscribe(deviceId: string): Promise<void>
  sendWateringReminder(plantNames: string[]): Promise<void>
}
