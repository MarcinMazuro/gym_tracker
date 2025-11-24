// frontend/src/utils/restTimerNotifications.ts
// Background notifications using Service Worker

/**
 * Register service worker for background notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        console.log('Service Worker registered successfully');
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

/**
 * Request notification permissions and schedule rest timer notification
 */
export const scheduleRestNotification = async (durationSeconds: number, exerciseName: string) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
        }
    }

    if (Notification.permission !== 'granted') {
        return;
    }

    // Get or register service worker
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration) {
        console.error('Service Worker not available');
        return;
    }

    // Send message to service worker to schedule notification
    if (registration.active) {
        registration.active.postMessage({
            type: 'SCHEDULE_REST_NOTIFICATION',
            durationMs: durationSeconds * 1000,
            exerciseName: exerciseName,
            startTime: Date.now()
        });
        console.log(`✅ Rest notification scheduled for ${durationSeconds}s via Service Worker`);
    }
};

/**
 * Cancel scheduled notification
 */
export const cancelRestNotification = async () => {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration?.active) {
        registration.active.postMessage({
            type: 'CANCEL_REST_NOTIFICATION'
        });
        
        // Also close any visible notifications
        const notifications = await registration.getNotifications({ tag: 'rest-timer' });
        notifications.forEach(notification => notification.close());
    }
};

/**
 * Show immediate notification (when timer expires while app was closed)
 */
export const showRestExpiredNotification = (exerciseName: string, overtimeSeconds: number) => {
    if (Notification.permission === 'granted') {
        new Notification('Rest Timer Expired ⏰', {
            body: `Your rest for ${exerciseName} ended ${Math.floor(overtimeSeconds / 60)}m ${overtimeSeconds % 60}s ago`,
            icon: '/icon-192x192.png',
            tag: 'rest-expired',
            requireInteraction: true, // Stay visible until clicked
        });
    }
};

/**
 * Request notification permission on app startup
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};