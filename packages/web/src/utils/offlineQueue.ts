interface OfflineAction {
  id: string;
  type: "CREATE_SERVICE" | "UPDATE_SERVICE" | "UPDATE_STATUS" | "CREATE_QUOTE";
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

const QUEUE_KEY = "offlineQueue";

export function getOfflineQueue(): OfflineAction[] {
  const data = localStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addToQueue(action: Omit<OfflineAction, "id" | "timestamp">): OfflineAction {
  const queue = getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  queue.push(newAction);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  // Request sync if available
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker?.ready.then((registration: any) => {
      if (registration.sync) {
        registration.sync.register("sync-offline-actions").catch(() => {
          console.log("Background sync not available");
        });
      }
    });
  }
  
  return newAction;
}

export function removeFromQueue(id: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueLength(): number {
  return getOfflineQueue().length;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const synced: string[] = [];
  const failed: string[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        synced.push(item.id);
      } else {
        failed.push(item.id);
      }
    } catch (err) {
      failed.push(item.id);
    }
  }

  // Remove synced items
  const remaining = queue.filter((item) => !synced.includes(item.id));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  return { synced: synced.length, failed: failed.length };
}
