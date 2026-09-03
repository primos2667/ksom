"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const VAPID_PUBLIC_KEY = "BNYpK03VyTYpD0MztEknakF3Gscvwkm4C2qb7yvwfnE235vBCUFF650d1fZPPY5AvS27K_h0yH4ptdeHWaFHfwQ";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ✅ Auto-register SW immediately so background push works even before enable
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('✅ SW registered for background badge');
      }).catch((e) => console.log('SW register failed', e));
    }

    // Check if already installed (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      // Still continue to check push, don't return
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setPushEnabled(true);
      }).catch(() => { });
    }

    // Check if user dismissed install recently - show again after 1 day
    const dismissedAt = localStorage.getItem('ksom-install-dismissed-at');
    if (dismissedAt) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < oneDay) {
        console.log('Install banner dismissed, will show again tomorrow');
        // Don't show install now, but still allow push banner
      } else {
        // Expired, clear and allow show
        localStorage.removeItem('ksom-install-dismissed-at');
      }
    }

    const handler = (e: any) => {
      e.preventDefault();
      // Only show if not dismissed recently
      const dismissed = localStorage.getItem('ksom-install-dismissed-at');
      if (dismissed) {
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissed) < oneDay) return;
      }
      setDeferredPrompt(e);
      setShowInstall(true);
      console.log('✅ Install prompt ready - banner will show till installed');
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show after 5 seconds if not installed and not dismissed (for testing)
    const timeout = setTimeout(() => {
      if (!isInstalled && !showInstall) {
        const dismissed = localStorage.getItem('ksom-install-dismissed-at');
        if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
          // If deferredPrompt exists, show
          if (deferredPrompt) setShowInstall(true);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timeout);
    };
  }, []);

  const handleLater = () => {
    // Save dismissed time - will come back after 1 day
    localStorage.setItem('ksom-install-dismissed-at', Date.now().toString());
    setShowInstall(false);
    console.log('User clicked Later - banner will come back tomorrow');
  };

  const enablePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push not supported on this browser. Use Chrome Android.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered', reg);
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        alert('Please allow notifications to get badge on home screen! You blocked it.');
        return;
      }
      console.log('Subscribing with VAPID...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('Got subscription', sub.endpoint);
      const supabase = createClient();
      const { data, error } = await supabase.from('push_subscriptions').insert([{
        subscription: sub.toJSON(),
        endpoint: sub.endpoint,
        created_at: new Date().toISOString(),
      }]).select();
      if (error) {
        console.error('Supabase insert error', error);
        alert('Supabase error: ' + error.message + '\n\nFix: Go to Supabase SQL Editor and run:\ncreate policy \"Allow all\" on push_subscriptions for all using (true) with check (true);');
        // Still show enabled locally even if DB fails, so push still works via SW?
      } else {
        console.log('Saved to DB', data);
      }
      setPushEnabled(true);
      localStorage.setItem('ksom-push-enabled', 'true');
      if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(1).catch(() => { });
        setTimeout(() => {
          if ('clearAppBadge' in navigator) (navigator as any).clearAppBadge().catch(() => { });
        }, 2000);
      }
      alert('✅ Enabled! Badge will show even when app closed! Now check Supabase table - should have 1 row!');
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
        setTimeout(() => { try { navigator.vibrate([500]) } catch { } }, 300);
      }
    } catch (e: any) {
      console.error('Push failed', e);
      alert('Failed: ' + e.message + '\n\nTry: Chrome Settings > Site Settings > ksom-omega.vercel.app > Clear & Reset, then try again!');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: show manual instructions
      alert('To install:\n\n1. Tap menu (3 dots) in Chrome\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap Install');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    if (outcome === 'accepted') {
      setShowInstall(false);
      localStorage.removeItem('ksom-install-dismissed-at');
    } else {
      // User dismissed install prompt, treat as Later
      handleLater();
    }
    setDeferredPrompt(null);
  };

  // ✅ SSR SAFE - Don't render notification UI on server (window is not defined during build)
  if (typeof window === 'undefined') return null;

  // If already installed, don't show install banner, but still show push enable if needed
  if (isInstalled) {
    const notifExists = typeof window !== 'undefined' && 'Notification' in window;
    const perm = notifExists ? (Notification as any).permission : 'default';
    if (permission !== 'denied' && notifExists && perm !== 'granted') {
      return (
        <div className="fixed bottom-20 left-4 right-4 z-[60] bg-[#0f172a] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold">🔔</div>
            <div>
              <p className="text-sm font-bold">Enable Notifications</p>
              <p className="text-xs opacity-70">Get badge on app icon when new product!</p>
            </div>
          </div>
          <button onClick={enablePush} className="bg-[#0d9488] text-white text-xs font-bold px-4 py-2 rounded-full">Enable</button>
        </div>
      );
    }
    return null;
  }

  // ✅ ALWAYS show Enable first if not granted - PRIORITY over Install! - SSR SAFE
  if (typeof window !== 'undefined') {
    const notifExists = 'Notification' in window;
    const currentPerm = notifExists ? (Notification as any).permission : 'default';
    if (permission !== 'denied' && notifExists && currentPerm !== 'granted') {
      const alreadySubscribed = localStorage.getItem('ksom-push-enabled');
      if (!alreadySubscribed || currentPerm !== 'granted') {
        return (
          <div className="fixed bottom-20 left-4 right-4 z-[60] bg-[#0f172a] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold">🔔</div>
              <div>
                <p className="text-sm font-bold">Enable Notifications</p>
                <p className="text-xs opacity-70">Get badge on app icon when new product!</p>
              </div>
            </div>
            <button onClick={enablePush} className="bg-[#0d9488] text-white text-xs font-bold px-4 py-2 rounded-full animate-pulse">Enable</button>
          </div>
        );
      }
    }
  }

  // Show install banner - ALWAYS till installed! Later makes it come back tomorrow!
  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] bg-[#0f172a] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#0f172a] font-bold">P</div>
        <div>
          <p className="text-sm font-bold">Install Prima KSOM</p>
          <p className="text-xs opacity-70">Add to home screen for badge + fast access</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleLater} className="text-xs px-3 py-2 opacity-60 hover:opacity-100">Later</button>
        <button onClick={handleInstall} className="bg-[#0d9488] text-white text-xs font-bold px-4 py-2 rounded-full">Install</button>
      </div>
    </div>
  );
}
