"use client";
import { useEffect, useState } from "react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] bg-navy text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-navy font-bold">P</div>
        <div>
          <p className="text-sm font-bold">Install Prima KSOM</p>
          <p className="text-xs opacity-70">Add to home screen for fast access</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowInstall(false)} className="text-xs px-3 py-2 opacity-60">Later</button>
        <button onClick={handleInstall} className="bg-teal text-white text-xs font-bold px-4 py-2 rounded-full">Install</button>
      </div>
    </div>
  );
}
