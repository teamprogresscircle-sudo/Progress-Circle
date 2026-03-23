import api from '../api/client';

const VAPID_PUBLIC_KEY = 'BMcLomjs8L2VYq4OO2ep_JIy7wgRofN0uwMfhSfurLTkcer4v2hOgkFhhe2zndh7WYO4spCvnScBMXRcQSdvrJI';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
        return existingSubscription;
    }

    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    
    // Send subscription to backend
    await api.post('/notifications/subscribe', subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
  }
}

export async function unsubscribeUserFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
  }
}
