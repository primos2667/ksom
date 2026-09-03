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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('✅ SW registered');
      }).catch((e) => console.log('SW register failed', e));
    }

    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) setPushEnabled(true);
        }).catch(() => { });
      }
    }

    const dismissedAt = localStorage.getItem('ksom-install-dismissed-at');
    if (dismissedAt) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) > oneDay) {
        localStorage.removeItem('ksom-install-dismissed-at');
      }
    }
    const notifDismissedAt = localStorage.getItem('ksom-notif-dismissed-at');
    if (notifDismissedAt) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(notifDismissedAt) > oneDay) {
        localStorage.removeItem('ksom-notif-dismissed-at');
      }
    }

    const handler = (e: any) => {
      e.preventDefault();
      const dismissed = localStorage.getItem('ksom-install-dismissed-at');
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const timeout = setTimeout(() => {
      if (!isInstalled && !showInstall) {
        const dismissed = localStorage.getItem('ksom-install-dismissed-at');
        if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
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
    localStorage.setItem('ksom-install-dismissed-at', Date.now().toString());
    setShowInstall(false);
  };

  const handleNotifLater = () => {
    localStorage.setItem('ksom-notif-dismissed-at', Date.now().toString());
    setPermission('denied' as any);
    setTimeout(() => setPermission('default'), 100);
  };

  const enablePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setShowError('Push not supported on this browser. Use Chrome on Android for best experience.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        if (perm === 'denied') {
          setShowError('Notifications blocked. Allow in browser settings to get updates!');
        }
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const supabase = createClient();
      await supabase.from('push_subscriptions').insert([{
        subscription: sub.toJSON(),
        endpoint: sub.endpoint,
        created_at: new Date().toISOString(),
      }]).select();
      setPushEnabled(true);
      localStorage.setItem('ksom-push-enabled', 'true');
      if ('setAppBadge' in navigator) {
        try { (navigator as any).setAppBadge(1).catch(() => { }); setTimeout(() => { try { (navigator as any).clearAppBadge().catch(() => { }); } catch { } }, 2000); } catch { }
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e: any) {
      console.error('Push failed', e);
      setShowError('Could not enable notifications. Try clearing site data and try again.');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowError('To install: Tap menu (3 dots) → Add to Home Screen → Install');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
      localStorage.removeItem('ksom-install-dismissed-at');
    } else {
      handleLater();
    }
    setDeferredPrompt(null);
  };

  if (typeof window === 'undefined') return null;

  const notifDismissed = localStorage.getItem('ksom-notif-dismissed-at');
  const isNotifDismissed = notifDismissed && Date.now() - parseInt(notifDismissed) < 24 * 60 * 60 * 1000;
  const installDismissed = localStorage.getItem('ksom-install-dismissed-at');
  const isInstallDismissed = installDismissed && Date.now() - parseInt(installDismissed) < 24 * 60 * 60 * 1000;

  return (
    <>
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-[slideDown_0.4s_ease-out]">
          <div className="bg-[#1e1e1e]/80 backdrop-blur-[24px] border border-white/10 rounded-[20px] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 min-w-[280px]">
            <div className="w-10 h-10 rounded-full bg-[#0d9488] grid place-items-center text-white text-[18px]">✓</div>
            <div>
              <p className="text-white text-[13px] font-bold">Enabled! 🔔</p>
              <p className="text-white/60 text-[11px]">You'll get updates for new products</p>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-[slideDown_0.4s_ease-out] max-w-[90vw]">
          <div className="bg-[#1e1e1e]/80 backdrop-blur-[24px] border border-white/10 rounded-[20px] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 grid place-items-center text-white text-[14px] shrink-0">!</div>
              <div className="flex-1">
                <p className="text-white text-[12px] leading-[1.4]">{showError}</p>
                <button onClick={() => setShowError(null)} className="mt-2 text-[11px] text-white/60 underline">Close</button>
              </div>
              <button onClick={() => setShowError(null)} className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-white/60 text-[12px]">✕</button>
            </div>
          </div>
        </div>
      )}

      {!isNotifDismissed && !pushEnabled && typeof window !== 'undefined' && 'Notification' in window && (Notification as any).permission !== 'granted' && permission !== 'denied' && (
        <div className="fixed bottom-20 left-4 right-4 z-[60] animate-[slideUp_0.4s_ease-out]">
          <div className="bg-[#1e1e1e]/60 backdrop-blur-[24px] border border-white/10 rounded-[20px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center text-white font-bold">🔔</div>
              <div>
                <p className="text-sm font-bold text-white">Enable Notifications</p>
                <p className="text-xs text-white/60">Get updates when new items drop</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={handleNotifLater} className="text-xs px-3 py-2 text-white/50 hover:text-white/80 transition-colors">Later</button>
              <button onClick={enablePush} className="bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform">Enable</button>
            </div>
          </div>
        </div>
      )}

      {!isInstallDismissed && showInstall && (
        <div className="fixed bottom-20 left-4 right-4 z-[60] animate-[slideUp_0.4s_ease-out]">
          <div className="bg-[#1e1e1e]/60 backdrop-blur-[24px] border border-white/10 rounded-[20px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center text-white font-bold">P</div>
              <div>
                <p className="text-sm font-bold text-white">Install Prima KSOM</p>
                <p className="text-xs text-white/60">Add to home screen for fast access</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={handleLater} className="text-xs px-3 py-2 text-white/50 hover:text-white/80 transition-colors">Later</button>
              <button onClick={handleInstall} className="bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform">Install</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </>
  );
}
