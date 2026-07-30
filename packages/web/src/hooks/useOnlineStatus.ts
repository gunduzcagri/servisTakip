import { useState, useEffect } from "react";

interface UseOnlineStatus {
  isOnline: boolean;
  pendingSync: number;
}

export function useOnlineStatus(): UseOnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Trigger background sync if available
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration: any) => {
          if (registration.sync) {
            registration.sync.register("sync-offline-actions").catch(() => {
              // Fallback: manual sync
              const queue = localStorage.getItem("offlineQueue");
              if (queue) setPendingSync(JSON.parse(queue).length);
            });
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      const queue = localStorage.getItem("offlineQueue");
      if (queue) setPendingSync(JSON.parse(queue).length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setPendingSync(event.data.remaining);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    // Initial queue check
    const queue = localStorage.getItem("offlineQueue");
    if (queue) setPendingSync(JSON.parse(queue).length);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  return { isOnline, pendingSync };
}
