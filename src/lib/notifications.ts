const VAPID_PUBLIC_KEY =
  'BPl6xSOzEPmBbSLHpKnSMu0bPcHbSMqmkNQFHRfOOF8yGZDsRiIRfYS5JFNuqEaSMmMApGnOHEBslcSPDnIjVQ';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }
  return Notification.requestPermission();
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }
  return navigator.serviceWorker.register('/sw.js');
}

export function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): Notification | null {
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  return new Notification(title, {
    body,
    icon: '/icon-192.png',
    ...options,
  });
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  return subscription;
}
