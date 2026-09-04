"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

function NotificationBell({ isDark }: { isDark: boolean }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ksm_notifications") || "[]");
    setNotifs(saved);
    const unread = saved.filter((n: any) => !n.read).length;
    setHasNew(unread > 0);
    if (unread > 0 && 'setAppBadge' in navigator) {
      (navigator as any).setAppBadge(unread).catch(() => { });
    } else if (unread === 0 && 'clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch(() => { });
    }

    const supabase = createClient();
    const myWhatsApp = localStorage.getItem("ksm_whatsapp") || localStorage.getItem("ksm_seller_whatsapp") || "";
    const channel = supabase.channel('ksom-notif-v12').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
      const newProduct = payload.new as any;
      // 🚫 Don't notify for own posts (but allow for testing if different phone)
      const myWa = (myWhatsApp || "").replace(/[^0-9]/g, '').slice(-9);
      const prodWa = String(newProduct.whatsapp || "").replace(/[^0-9]/g, '').slice(-9);
      if (myWa && prodWa && myWa === prodWa) {
        // For testing, still vibrate even for own post if you want
        // Comment this return if you want to test with same WhatsApp
        console.log("Skipping notif for own post - use different WhatsApp to test!");
        return;
      }
      const newNotif = { id: Date.now().toString() + "_" + newProduct.id, type: "product", title: "New product on KSOM", message: `${newProduct.title} • ${newProduct.price}`, created_at: new Date().toISOString(), read: false, image: newProduct.image_url, productId: newProduct.id };
      const current = JSON.parse(localStorage.getItem("ksm_notifications") || "[]");
      // 🚫 Prevent duplicate notifs for same product
      if (current.some((n: any) => n.productId === newProduct.id)) return;
      const updated = [newNotif, ...current].slice(0, 20);
      localStorage.setItem("ksm_notifications", JSON.stringify(updated));
      setNotifs(updated);
      setHasNew(true);
      // ✅ App icon badge + vibration - FIXED
      try {
        const newUnread = updated.filter((n: any) => !n.read).length;
        // Badge on app icon
        if ('setAppBadge' in navigator) {
          (navigator as any).setAppBadge(newUnread).catch(() => { });
        }
      } catch { }
      // ✅ VIBRATION - OLD PULSING THAT WORKED + STRONGER!
      try {
        if (navigator.vibrate) {
          // Strong vibration like old pulsing version that worked for you!
          navigator.vibrate([200, 100, 200, 100, 400]);
          // Extra strong after delay
          setTimeout(() => { try { navigator.vibrate([500]); } catch { } }, 200);
          setTimeout(() => { try { navigator.vibrate([200, 100, 200]); } catch { } }, 800);
        }
      } catch (e) {
        console.log("Vibrate failed", e);
      }
      // Also try via SW
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'VIBRATE' });
        }
      } catch { }
      window.dispatchEvent(new Event('ksom-notif-update'));

    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('KSOM notif realtime ON v12');
      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime error - Enable Realtime in Supabase Dashboard > Database > products > Enable Realtime!');
        console.warn('Fix: Go to Supabase > Database > Tables > products > Enable Realtime toggle ON');
      }
    });

    // Listen for updates from other tabs/components
    const handleUpdate = () => {
      const s = JSON.parse(localStorage.getItem("ksm_notifications") || "[]");
      setNotifs(s);
      setHasNew(s.filter((n: any) => !n.read).length > 0);
    };
    window.addEventListener('ksom-notif-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 2000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('ksom-notif-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const markRead = () => {
    const updated = notifs.map((n: any) => ({ ...n, read: true }));
    setNotifs(updated);
    localStorage.setItem("ksm_notifications", JSON.stringify(updated));
    setHasNew(false);
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch(() => { });
    }
    window.dispatchEvent(new Event('ksom-notif-update'));
  };

  const unread = notifs.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => { setShow(!show); if (!show) markRead(); }} className={`relative w-10 h-10 rounded-full grid place-items-center backdrop-blur border transition-all active:scale-90 ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/10 text-black"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 6 9 6 9H0s6-2 6-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
        {hasNew && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full grid place-items-center px-1 border-2 border-white dark:border-[#1e1e1e]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {show && (
        <div className={`absolute bottom-[52px] left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 w-[320px] max-h-[420px] rounded-[20px] border shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden z-[100] backdrop-blur-xl ${isDark ? "bg-[#1e1e1e]/95 border-white/10" : "bg-white/95 border-black/10"}`}>
          <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-white/10" : "border-black/5"}`}><h3 className={`text-[13px] font-bold ${isDark ? "text-white" : "text-black"}`}>Notifications {unread > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>}</h3><button onClick={() => setShow(false)} className={`w-7 h-7 rounded-full grid place-items-center ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"}`}>✕</button></div>
          <div className="overflow-y-auto max-h-[360px]">{notifs.length === 0 ? <div className="p-8 text-center"><p className={`text-[12px] ${isDark ? "text-white/60" : "text-black/50"}`}>No notifications yet</p><p className="text-[10px] opacity-40 mt-2">When someone posts new product, you will get badge here</p></div> : notifs.map((n: any) => (<div key={n.id} className={`p-3.5 flex gap-3 border-b ${isDark ? "border-white/5" : "border-black/5"}`}><img src={n.image} className="w-10 h-10 rounded-full object-cover" /><div className="flex-1"><p className={`text-[12px] ${isDark ? "text-white" : "text-black"}`}>{n.title} • {n.message}</p><p className="text-[9px] opacity-40 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p></div></div>))}</div>
          <div className="p-2 text-center border-t dark:border-white/10">
            <button onClick={() => { localStorage.removeItem('ksm_notifications'); setNotifs([]); setHasNew(false); if ('clearAppBadge' in navigator) (navigator as any).clearAppBadge().catch(() => { }); }} className="text-[10px] opacity-50">Clear all</button>
          </div>
        </div>
      )}
    </div>
  );
}

const WHATSAPP_COMMUNITY_LINK = "https://chat.whatsapp.com/JDF0gdFMiQQKz9GslNGWav";


function MorningNews({ isDark }: { isDark: boolean }) {
  const [news, setNews] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [expandedNews, setExpandedNews] = useState<any>(null);

  useEffect(() => {
    const defaultNews = [
      {
        id: "1",
        title: "Ghana Black Stars qualify for AFCON 2026! 🇬🇭",
        summary: "Black Stars beat Nigeria 2-1 in thrilling match at Kumasi...",
        image_url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
        source: "BBC Sport",
        url: "https://www.bbc.com/sport/football",
        category: "Sports",
        time: "2h ago"
      },
      {
        id: "2",
        title: "KNUST gets $10M tech hub from Google 💻",
        summary: "New AI lab to open at College of Engineering next semester...",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
        source: "TechCrunch",
        url: "https://techcrunch.com",
        category: "Tech",
        time: "5h ago"
      },
      {
        id: "3",
        title: "Scholarship: 500 to study in UK 🎓",
        summary: "Ghana government announces full scholarship for STEM students...",
        image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
        source: "GhanaWeb",
        url: "https://www.ghanaweb.com",
        category: "Education",
        time: "8h ago"
      }
    ];
    const loadNews = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("morning_news").select("*").order("created_at", { ascending: false }).limit(3);
        if (data && data.length > 0) setNews(data);
        else setNews(defaultNews);
      } catch { setNews(defaultNews); }
    };
    loadNews();
  }, []);

  useEffect(() => {
    if (news.length <= 1) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % news.length), 5500);
    return () => clearInterval(timer);
  }, [news]);

  if (news.length === 0) return null;

  return (
    <>
      <div className="px-5 mt-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60 font-bold flex items-center gap-1.5" style={{ color: isDark ? 'white' : 'black' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Your Morning News • {new Date().toLocaleDateString('en-GH', { weekday: 'long' })}
          </h2>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">LIVE</span>
        </div>
        <div className="relative rounded-[20px] overflow-hidden bg-black h-[210px]">
          {news.map((item, idx) => (
            <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <img src={item.image_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full">{item.category}</span>
                <span className="bg-black/60 text-white text-[9px] px-2.5 py-1 rounded-full backdrop-blur">{item.time || "Today"}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white text-[15px] font-bold leading-tight line-clamp-2">{item.title}</h3>
                <p className="text-white/70 text-[11px] mt-1 line-clamp-1">{item.summary}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setExpandedNews(item)} className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-full active:scale-95">Read Summary</button>
                  <a href={item.url} target="_blank" className="bg-white/20 backdrop-blur text-white border border-white/20 text-[11px] font-bold px-4 py-2 rounded-full flex items-center gap-1">Full on {item.source} ↗</a>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {news.map((_, idx) => (<button key={idx} onClick={() => setCurrent(idx)} className={`transition-all rounded-full ${idx === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}></button>))}
          </div>
        </div>
      </div>
      <div className="px-5 mt-6 mb-2 flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-black/10 dark:bg-white/10"></div>
        <span className="text-[10px] tracking-[0.3em] uppercase opacity-30 font-bold" style={{ color: isDark ? 'white' : 'black' }}>..................... Your Morning News .....................</span>
        <div className="h-[1px] flex-1 bg-black/10 dark:bg-white/10"></div>
      </div>
      {expandedNews && (
        <div onClick={() => setExpandedNews(null)} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md grid place-items-center p-4">
          <button onClick={() => setExpandedNews(null)} className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white grid place-items-center">✕</button>
          <div className="w-full max-w-md bg-white rounded-[20px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-48 bg-black">
              <img src={expandedNews.image_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{expandedNews.category}</span>
                <h2 className="text-white text-[16px] font-bold mt-2 leading-tight">{expandedNews.title}</h2>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-black/70 leading-[1.5]">{expandedNews.summary} Complete story available on {expandedNews.source}.</p>
              <div className="mt-4 grid gap-2">
                <a href={expandedNews.url} target="_blank" className="w-full bg-black text-white rounded-full py-3 text-[13px] font-bold text-center">Read Full on {expandedNews.source} →</a>
                <button onClick={() => setExpandedNews(null)} className="w-full bg-black/5 text-black rounded-full py-3 text-[13px] font-bold">Close & See Market ↓</button>
              </div>
              <p className="text-[10px] opacity-40 text-center mt-3">☕ Morning news done! Now check KSOM below 👇</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default function HomeV11() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = localStorage.getItem("ksom-theme") as "light" | "dark" | null;
      if (saved) return saved;
      if (document.documentElement.classList.contains("dark")) return "dark";
      if (document.documentElement.classList.contains("light")) return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch { return "dark"; }
  });
  const [ad, setAd] = useState(0);
  const [active, setActive] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [adverts, setAdverts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedAd, setExpandedAd] = useState<any>(null);
  const [expandedProduct, setExpandedProduct] = useState<any>(null);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const latestRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreDB, setHasMoreDB] = useState(true);
  const [totalFetched, setTotalFetched] = useState(100);

  const fetchProducts = async (silent = true, append = false, limitCount = 100) => {
    const supabase = createClient();
    const from = append ? products.length : 0;
    const to = from + limitCount - 1;
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).range(from, to);
    if (data) {
      if (append) {
        if (data.length > 0) {
          // ✅ FIX: Deduplicate to prevent double images like in your screenshot
          setProducts(prev => {
            const existingIds = new Set(prev.map((p: any) => p.id));
            const uniqueNew = data.filter((d: any) => !existingIds.has(d.id));
            if (uniqueNew.length === 0) {
              setHasMoreDB(false);
              return prev;
            }
            return [...prev, ...uniqueNew];
          });
          setTotalFetched(prev => prev + data.length);
          if (data.length < limitCount) setHasMoreDB(false);
        } else {
          setHasMoreDB(false);
        }
      } else if (data.length > 0) {
        if (!silent || products.length === 0 || (data[0] && products[0] && data[0].id !== products[0].id)) {
          // ✅ FIX: Deduplicate initial fetch too
          const uniqueData = Array.from(new Map(data.map((d: any) => [d.id, d])).values());
          setProducts(uniqueData);
          setTotalFetched(uniqueData.length);
          setHasMoreDB(uniqueData.length >= limitCount);
          setLastUpdate(new Date());
          if (!silent && uniqueData.length > products.length) {
            const newItems = uniqueData.filter((d: any) => !products.some((p: any) => p.id === d.id));
            if (newItems.length > 0 && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }
        }
      }
    }
    setIsLoadingMore(false);
  };

  const loadMoreProducts = async (currentFilteredLength?: number) => {
    const len = currentFilteredLength ?? filtered.length;
    if (isLoadingMore) return;
    // First show more from already fetched
    if (visibleCount < len) {
      setVisibleCount(v => v + 20);
      return;
    }
    // If we have shown all fetched but DB has more, fetch next batch like Jumia
    if (hasMoreDB && visibleCount >= len) {
      setIsLoadingMore(true);
      await fetchProducts(true, true, 40);
      setVisibleCount(v => v + 20);
    }
  };

  useEffect(() => {
    document.title = "KSOM - KNUST Students Online Market";
    // Theme already set synchronously in useState - don't override! Just sync html class
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const saved = localStorage.getItem("ksom-theme");
    if (!saved) {
      setTheme(m.matches ? "dark" : "light");
    }
    const savedCart = JSON.parse(localStorage.getItem("ksm_cart") || "[]");
    setCart(savedCart);
    setViewCounts(JSON.parse(localStorage.getItem("ksm_views") || "{}"));

    // 🧹 AUTO-CLEAN CHECK - runs for every visitor, even if you forget!
    const checkAndAutoClean = async () => {
      try {
        const lastClean = localStorage.getItem("ksom_last_auto_clean");
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        // Only check once per day per browser to save queries
        if (lastClean === todayStr) return;

        const supabase = createClient();
        // Check if today is clean day (Jan 1, Apr 1, Jul 1, Oct 1) OR if storage is over 85%
        const isCleanDay = (now.getDate() === 1 && [0, 3, 6, 9].includes(now.getMonth()));
        const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
        const isOverLimit = (count || 0) >= 2400; // 80% of 3000

        if (isCleanDay || isOverLimit) {
          console.log("🧹 Auto-clean triggered!", { isCleanDay, isOverLimit, count });
          // Call the auto-clean function that deletes DB + Storage
          const { data: oldProducts } = await supabase.from("products").select("id, image_url").lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
          if (oldProducts && oldProducts.length > 0) {
            // Delete from storage
            const paths = oldProducts.map((p: any) => p.image_url?.includes("product-images") ? p.image_url.split("/product-images/")[1]?.split("?")[0] : null).filter(Boolean);
            if (paths.length > 0) await supabase.storage.from("product-images").remove(paths);
            // Delete from DB - this will work because RLS allows delete for old products via function
            const { error } = await supabase.from("products").delete().lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
            if (!error) {
              console.log(`✅ Auto-cleaned ${oldProducts.length} old products!`);
              localStorage.setItem("ksom_last_auto_clean", todayStr);
              // Show notification to user
              if (Notification && Notification.permission === "granted") {
                new Notification("KSOM Auto-Cleaned", { body: `Cleaned ${oldProducts.length} old items. More space now!` });
              }
            }
          } else {
            localStorage.setItem("ksom_last_auto_clean", todayStr);
          }
        }
      } catch (e) {
        console.log("Auto-clean check failed (RLS may block, that's ok - admin button still works)", e);
      }
    };
    checkAndAutoClean();

    const supabase = createClient();
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => {
      if (data && data.length > 0) setProducts(data);
      else setProducts([
        { id: "1", title: "iPhone 13 128GB · Neat", price: "GH₵ 4,200", location: "Ayeduase", image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400", category: "Phones", whatsapp: "233540000001", seller_name: "Prince Phones", views: 124 },
        { id: "2", title: "Study Desk + Chair Combo", price: "GH₵ 380", location: "Kotei", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", category: "Furniture", whatsapp: "233540000002", seller_name: "Kotei Furnitures", views: 89 },
        { id: "3", title: "Nike Air Max 270 · Size 42", price: "GH₵ 550", location: "Boadi", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", category: "Shoes", whatsapp: "233540000003", seller_name: "Sneaker Hub", views: 201 },
      ]);
      setLastUpdate(new Date());
    });
    supabase.from("adverts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(3).then(({ data }) => { if (data) setAdverts(data); });
    supabase.from("collections").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      if (data && data.length > 0) setCollections(data);
      else setCollections([
        { id: "c1", seller_name: "Prince Phones", description: "iPhones & Laptops", image_url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400", whatsapp: "233540000001" },
        { id: "c2", seller_name: "Sneaker Hub", description: "Original Sneakers", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", whatsapp: "233540000003" },
      ]);
    });

    // Listen for cart changes
    const onCartUpdate = () => {
      setCart(JSON.parse(localStorage.getItem("ksm_cart") || "[]"));
    };
    window.addEventListener('storage', onCartUpdate);
    window.addEventListener('ksom-cart-update', onCartUpdate);
    return () => {
      window.removeEventListener('storage', onCartUpdate);
      window.removeEventListener('ksom-cart-update', onCartUpdate);
    };
  }, []);

  // 🔄 REALTIME + AUTO REFRESH - No need to manually refresh for views!
  useEffect(() => {
    const supabase = createClient();

    // 🔔 Realtime: Listen for NEW products and VIEW updates
    const channel = supabase.channel('ksom-products-realtime-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
        console.log('🔔 New product realtime:', payload.new);
        const newProd = payload.new as any;
        // Auto-add to top of list - no refresh needed!
        setProducts(prev => {
          if (prev.some((p: any) => p.id === newProd.id)) return prev; // prevent duplicate
          return [newProd, ...prev];
        });
        setLastUpdate(new Date());
        if (navigator.vibrate) navigator.vibrate([50]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        console.log('👁 Views updated realtime:', payload.new);
        const updated = payload.new as any;
        // Auto-update views count without refresh!
        setProducts(prev => prev.map((p: any) => p.id === updated.id ? { ...p, views: updated.views, ...updated } : p));
        setViewCounts(prev => ({ ...prev, [updated.id]: updated.views || 0 }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
        console.log('🗑 Product deleted:', payload.old);
        setProducts(prev => prev.filter((p: any) => p.id !== (payload.old as any).id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('✅ KSOM realtime LIVE - auto refresh ON!');
        if (status === 'CHANNEL_ERROR') console.warn('⚠️ Enable Realtime in Supabase for products table!');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔄 Fallback polling every 15s (if realtime fails)
  useEffect(() => {
    if (!autoRefreshOn) return;
    const interval = setInterval(() => {
      fetchProducts(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefreshOn, products]);

  // ♾️ infinite scroll moved after filtered definition

  // Also refresh when tab becomes visible again
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [products]);


  useEffect(() => {
    const len = adverts.length > 0 ? adverts.length : 3;
    const t = setInterval(() => setAd(p => (p + 1) % len), 3500);
    return () => clearInterval(t);
  }, [adverts.length]);

  const toggleCart = (id: string) => {
    const n = cart.includes(id) ? cart.filter(c => c !== id) : [...cart, id];
    setCart(n);
    localStorage.setItem("ksm_cart", JSON.stringify(n));
    // Dispatch event so other pages/tabs update instantly - NO REFRESH NEEDED
    window.dispatchEvent(new Event('ksom-cart-update'));
    window.dispatchEvent(new Event('storage'));
    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const incrementView = (id: string) => {
    // Optimistic update - immediate UI
    const currentViews = viewCounts[id] || products.find((p: any) => p.id === id)?.views || 0;
    const newCount = currentViews + 1;
    const newCounts = { ...viewCounts, [id]: newCount };
    setViewCounts(newCounts);
    localStorage.setItem("ksm_views", JSON.stringify(newCounts));
    // Update local products list immediately - no refresh needed
    setProducts(prev => prev.map((p: any) => p.id === id ? { ...p, views: newCount } : p));
    // Sync to DB - realtime will broadcast to other phones!
    const supabase = createClient();
    supabase.from("products").update({ views: newCount }).eq("id", id).then(({ error }) => {
      if (error) console.log("View update failed (RLS?)", error);
      else console.log(`👁 View incremented to ${newCount} for ${id} - will auto-sync to other phones via realtime`);
    });
  };
  const shareProduct = async (p: any) => {
    const url = `${window.location.origin}/product/${p.id}`;
    const text = `🔥 Check this on KSOM!\n\n📦 ${p.title}\n💰 ${p.price}\n📍 ${p.location}\n\n👉 ${url}\n\nJoin KSOM: ${WHATSAPP_COMMUNITY_LINK}`;
    if (navigator.share) { try { await navigator.share({ title: p.title, text, url }); return; } catch { } }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const openProduct = (p: any) => {
    incrementView(p.id);
    setExpandedProduct(p);
  };

  const executeSearch = () => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); setTimeout(() => { latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150); };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") executeSearch(); };
  const handleCategoryClick = (e: React.MouseEvent<HTMLButtonElement>, cat: string) => { setActive(cat); e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); };

  const isDark = theme === "dark";
  const cats = ["All", "Phones", "Fashion", "Electronics", "Shoes", "Grocery", "Books"];
  const defaultAds = ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800", "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400"];
  const displayAds = adverts.length > 0 ? adverts.map((a: any) => ({ img: a.image_url || defaultAds[0], title: a.business_name, desc: a.description, wa: a.whatsapp, isPaid: true, full: a })) : defaultAds.map((img, idx) => ({ img, title: ["KSOM Marketplace", "Advertise With Us", "KNUST Students"][idx], desc: ["Buy & Sell on campus", "Reach 10k+ students GH₵20/week", "Verified sellers only"][idx], wa: "", isPaid: false, full: { image_url: img, business_name: ["KSOM Marketplace", "Advertise With Us", "KNUST Students"][idx], description: ["Buy & Sell on campus", "Reach 10k+ students", "Verified sellers only"][idx], whatsapp: "" } }));
  const verifiedSellers = new Set(collections.map(c => c.seller_name.toLowerCase()));
  let filtered = active === "All" ? products : products.filter(p => p.category === active || p.category?.toLowerCase().includes(active.toLowerCase()));
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  // ✅ FIX: Deduplicate first, then fair shuffle - prevents double images
  const dedupedProducts = Array.from(new Map(filtered.map((p: any) => [p.id, p])).values());

  // 🛡️ Anti-domination: Shuffle so same seller doesn't appear 5 times in a row (fair feed like Jumia)
  const fairFiltered = (() => {
    const result: any[] = [];
    const sellerLastSeen: Record<string, number> = {};
    const queue = [...dedupedProducts];
    // Simple fair algorithm: don't allow same whatsapp 3 times in last 6 items
    while (queue.length > 0) {
      let idx = 0;
      for (let i = 0; i < queue.length; i++) {
        const wa = String(queue[i].whatsapp || "").replace(/[^0-9]/g, '').slice(-9);
        const lastPos = sellerLastSeen[wa] ?? -10;
        if (result.length - lastPos > 2) { // at least 2 other items between same seller
          idx = i;
          break;
        }
      }
      const picked = queue.splice(idx, 1)[0];
      const wa = String(picked.whatsapp || "").replace(/[^0-9]/g, '').slice(-9);
      sellerLastSeen[wa] = result.length;
      result.push(picked);
    }
    return result;
  })();

  // ♾️ JUMIA-STYLE INFINITE SCROLL - auto load when bottom visible (after filtered defined)
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (fairFiltered.length > visibleCount || hasMoreDB)) {
          loadMoreProducts(fairFiltered.length);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fairFiltered.length, visibleCount, hasMoreDB, isLoadingMore]);

  return (
    <div className={`${isDark ? "bg-[#0f0f0f] text-[#f5f3ef]" : "bg-[#fbfaf8] text-[#121212]"} min-h-screen pb-28 transition-colors`}>
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-[#0f0f0f]/90 border-white/10" : "bg-[#fbfaf8]/90 border-black/10"}`}>
        <div className="px-5 h-14 flex justify-between items-center"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-[#0f172a] grid place-items-center text-[#d4af37] font-extrabold text-[11px]">P</div><span className="text-[11px] tracking-[0.2em] uppercase font-medium">KSOM — KNUST</span></div><div className="flex items-center gap-2.5"><span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#0d9488" }}>Prima</span><a href="/login" className={`text-[11px] px-3.5 py-1.5 rounded-full border font-medium ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>Log in</a></div></div>
      </div>

      <MorningNews isDark={isDark} />

      <div className="px-5 pt-5"><h1 className="text-[26px] font-[700] leading-[0.95]">Students&apos; online<br />market</h1><div className="mt-3 flex items-center justify-between gap-3"><div className={`inline-flex rounded-full px-3 py-1.5 text-[10px] border shrink ${isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-black/60"}`}>Verified students · Chat on WhatsApp</div><a href={WHATSAPP_COMMUNITY_LINK} target="_blank" className="shrink-0 bg-[#0d9488] text-white text-[11px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">Join →</a></div></div>

      <div className="px-5 mt-5"><div className={`flex items-center rounded-full px-5 py-3.5 border ${isDark ? "bg-[#1c1c1c] border-white/10" : "bg-white border-black/10"}`}><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} enterKeyHint="search" placeholder="Search on KSOM" className={`bg-transparent outline-none text-[13px] flex-1 ${isDark ? "placeholder:text-white/25 text-white" : "placeholder:text-black/30"}`} /><button onClick={executeSearch} className={`w-7 h-7 rounded-full grid place-items-center text-[11px] active:scale-90 transition-transform ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>⌕</button></div>{search && <p className="text-[10px] mt-2 opacity-50">Searching for &quot;{search}&quot; — {filtered.length} found</p>}</div>

      <div className="mt-5 px-5 flex gap-2 overflow-x-auto scrollbar-none cats-smooth-v2">{cats.map(c => <button key={c} onClick={(e) => handleCategoryClick(e, c)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] border transition-all duration-300 ${active === c ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") : (isDark ? "bg-transparent text-white/50 border-white/10" : "bg-white text-black/60 border-black/10")}`}>{c}</button>)}</div>

      <div className="mt-6 px-3">
        <div className={`rounded-[20px] p-2 border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
          <div className="flex justify-between items-center px-3 py-2"><span className="text-[10px] tracking-[0.2em] uppercase opacity-50">{displayAds[ad]?.isPaid ? `${displayAds[ad]?.title} • AD` : "Advertisement"} • {ad + 1}/{displayAds.length}</span><a href="/advertise" className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>YOUR ADS →</a></div>
          <div onClick={() => setExpandedAd(displayAds[ad]?.full || { image_url: displayAds[ad]?.img, business_name: displayAds[ad]?.title, description: displayAds[ad]?.desc, whatsapp: displayAds[ad]?.wa })} className="rounded-[14px] overflow-hidden aspect-[16/9] relative bg-black cursor-pointer active:scale-[0.98] transition-transform select-none">
            <img src={displayAds[ad]?.img} className="absolute inset-0 w-full h-full object-cover blur-[26px] scale-110 opacity-70" alt="" /><img src={displayAds[ad]?.img} className="relative w-full h-full object-contain pointer-events-none" alt="" />
            {displayAds[ad]?.isPaid && <div className="absolute top-3 left-3 bg-yellow-400 text-black text-[9px] font-bold px-2 py-1 rounded-full">AD • {displayAds[ad]?.title}</div>}
            <div className="absolute bottom-3 left-3 flex gap-1">{displayAds.map((_: any, i: number) => <div key={i} className={`h-1 rounded-full transition-all ${i === ad ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}></div>)}</div>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[9px] px-2.5 py-1 rounded-full">Tap to expand 👆</div>
          </div>
          <div className="px-1 pt-2 flex justify-between items-center"><p className="text-[11px] opacity-60 truncate pr-2">{displayAds[ad]?.desc || "Reach 10k+ KNUST students"}</p>{displayAds[ad]?.isPaid ? <a onClick={(e) => { e.stopPropagation() }} href={`https://wa.me/${String(displayAds[ad]?.wa || "").replace(/[^0-9]/g, '')}`} target="_blank" className="shrink-0 bg-[#25D366] text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Contact</a> : <a href="/advertise" className="shrink-0 bg-black text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Advertise →</a>}</div>
        </div>
      </div>

      <div className="mt-8 px-5"><div className="flex justify-between items-center mb-3"><h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Featured Collections — {collections.length}</h2><a href="/collections" className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>Book a Spot →</a></div><div className="grid grid-cols-2 gap-3">{collections.slice(0, 6).map((c: any) => (<a key={c.id} href={`/seller/${encodeURIComponent(c.seller_name)}`} className={`rounded-[18px] overflow-hidden border relative h-[140px] group ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}><img src={c.image_url} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500" alt={c.seller_name} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div><div className="absolute top-2 left-2 bg-white text-black text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1">✓ Verified</div><div className="absolute bottom-0 left-0 right-0 p-3"><p className="text-white text-[12px] font-bold leading-tight flex items-center gap-1">{c.seller_name} <span className="w-3 h-3 bg-[#0d9488] rounded-full grid place-items-center text-[8px]">✓</span></p><p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{c.description}</p><span className="mt-1.5 inline-block text-[9px] px-2 py-1 rounded-full bg-white text-black font-bold">View Collection →</span></div></a>))}</div></div>

      <div ref={latestRef} id="latest-section" className="mt-8 px-5 scroll-mt-24">
        <div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2"><h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Latest — {fairFiltered.length} items • Tap to view</h2></div><a href="/sell" className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>+ Sell</a></div>

        {/* ✅ First 3: Full block (horizontal card) */}
        <div className="grid gap-3">{fairFiltered.slice(0, Math.min(3, visibleCount)).map((p: any) => {
          const isVerified = verifiedSellers.has((p.seller_name || "").toLowerCase());
          const views = viewCounts[p.id] ?? p.views ?? 0;
          return (
            <div key={p.id} onClick={() => openProduct(p)} className={`flex gap-3 rounded-[18px] p-3 border relative cursor-pointer active:scale-[0.98] transition-transform select-none ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
              <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 shrink-0 relative"><img src={p.image_url} className="w-full h-full object-cover pointer-events-none" alt="" /><div className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> {views}</div></div>
              <div className="flex-1 flex flex-col justify-between min-w-0"><div><div className="flex justify-between items-center"><div className="flex items-center gap-1"><span className={`text-[9px] px-2 py-0.5 rounded-full border ${isDark ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"}`}>{p.category}</span>{isVerified && <span className="w-4 h-4 bg-[#0d9488] rounded-full grid place-items-center text-white text-[9px]">✓</span>}</div><span className="text-[10px] opacity-40">{p.location}</span></div><p className="text-[13px] font-medium mt-1.5 leading-tight truncate flex items-center gap-1">{p.title} {isVerified && <span className="text-[#0d9488] text-[10px]">✓</span>}</p><div className="flex items-center gap-2 mt-1"><p className="text-[13px] font-bold">{p.price}</p><span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>{views} views • {views > 100 ? "🔥 Hot" : views > 50 ? "👀 Popular" : "New"}</span></div></div><div className="flex gap-1.5 mt-2"><button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${p.title} on KSOM`, "_blank"); }} className="flex-1 bg-[#25D366] text-white text-[11px] font-bold py-2 rounded-full text-center">💬 WhatsApp</button><button onClick={(e) => { e.stopPropagation(); toggleCart(p.id); }} className={`px-3 rounded-full text-[11px] font-bold border active:scale-95 transition-all ${cart.includes(p.id) ? "bg-black text-white border-black dark:bg-white dark:text-black" : isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}>{cart.includes(p.id) ? "✓" : "🛒"}</button><button onClick={(e) => { e.stopPropagation(); shareProduct(p); }} className={`w-9 h-9 rounded-full grid place-items-center border active:scale-90 transition-transform ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button></div></div>
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[8px] px-2 py-1 rounded-full">Tap to expand 👆</div>
            </div>
          );
        })}
        </div>

        {/* ✅ Rest: Side by side in two's (grid 2 cols) */}
        {fairFiltered.length > 3 && (
          <div className="mt-3 grid grid-cols-2 gap-3">{fairFiltered.slice(3, visibleCount).map((p: any) => {
            const isVerified = verifiedSellers.has((p.seller_name || "").toLowerCase());
            const views = viewCounts[p.id] ?? p.views ?? 0;
            return (
              <div key={p.id} onClick={() => openProduct(p)} className={`rounded-[18px] border overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform select-none ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
                <div className="aspect-square overflow-hidden bg-black/5 relative">
                  <img src={p.image_url} className="w-full h-full object-cover pointer-events-none" alt="" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="bg-white text-black text-[8px] font-bold px-2 py-1 rounded-full">{p.category}</span>
                    {isVerified && <span className="bg-[#0d9488] text-white text-[8px] font-bold px-2 py-1 rounded-full">✓</span>}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[8px] px-2 py-1 rounded-full backdrop-blur">👁 {views}</div>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[7px] px-1.5 py-0.5 rounded-full">Tap 👆</div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-medium leading-tight truncate flex items-center gap-1">{p.title} {isVerified && <span className="text-[#0d9488] text-[8px]">✓</span>}</p>
                  <p className="text-[10px] opacity-50 mt-0.5 truncate">📍 {p.location}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[12px] font-bold">{p.price}</p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/50"}`}>{views > 0 ? `${views} views` : "New"}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${p.title} on KSOM`, "_blank"); }} className="flex-1 bg-[#25D366] text-white text-[10px] font-bold py-2 rounded-full">WhatsApp</button>
                    <button onClick={(e) => { e.stopPropagation(); toggleCart(p.id); }} className={`w-8 h-8 rounded-full grid place-items-center text-[12px] border active:scale-90 ${cart.includes(p.id) ? "bg-black text-white border-black dark:bg-white dark:text-black" : isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}>{cart.includes(p.id) ? "✓" : "🛒"}</button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
        {/* ♾️ Jumia-style infinite loader */}
        <div ref={loadMoreRef} className="mt-5 flex flex-col items-center gap-3 py-4">
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin dark:border-white/20 dark:border-t-white"></div>
              <span className={`text-[12px] ${isDark ? "text-white/60" : "text-black/60"}`}>Loading more products...</span>
            </div>
          ) : fairFiltered.length > visibleCount ? (
            <div className={`text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>Scroll for more • {fairFiltered.length - visibleCount} more</div>
          ) : hasMoreDB ? (
            <div className={`text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>Fetching more from server...</div>
          ) : filtered.length > 0 ? (
            <div className={`text-[11px] flex items-center gap-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
              <span>✓</span> You've seen all {fairFiltered.length} items
            </div>
          ) : null}
        </div>
        {fairFiltered.length === 0 && (
          <div className="text-center py-10 opacity-50"><p className="text-[13px]">No items in this category</p></div>
        )}
      </div>

      <div className="mt-8 px-5"><div className="rounded-[18px] p-4 border flex justify-between items-center" style={{ background: "#0d9488", borderColor: "#0d9488" }}><div><p className="text-white text-[12px] font-bold">Want to advertise?</p><p className="text-white/80 text-[10px]">Let me run your ads for you</p></div><a href="/advertise" className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-full">Contact Me →</a></div></div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className={`flex items-center gap-1 rounded-full p-1.5 backdrop-blur-[28px] border shadow-[0_12px_32px_rgba(0,0,0,0.15)] ${isDark ? "bg-[#1e1e1e]/90 border-white/10" : "bg-white/90 border-black/10"}`}>
          <a href="/" className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-medium shadow-sm ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home
          </a>
          <NotificationBell isDark={isDark} />
          <a href="/cart" className={`w-10 h-10 rounded-full grid place-items-center backdrop-blur relative border transition-all active:scale-90 ${isDark ? "bg-white/10 text-white border-white/10" : "bg-black/5 text-black border-black/5"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full grid place-items-center px-1 font-bold border-2 border-white dark:border-[#1e1e1e] animate-pulse">{cart.length}</span>}
          </a>
          <a href="/sell" className="w-10 h-10 rounded-full grid place-items-center bg-[#0d9488] text-white border border-[#0d9488] shadow-sm active:scale-90 transition-all font-bold text-[18px]">+</a>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`w-10 h-10 rounded-full grid place-items-center border backdrop-blur font-bold transition-all active:scale-90 ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>{isDark ? "☀" : "☾"}</button>
        </div>
      </div>

      {expandedAd && (
        <div onClick={() => setExpandedAd(null)} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md grid place-items-center p-4">
          <button onClick={() => setExpandedAd(null)} className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white grid place-items-center">✕</button>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <img src={expandedAd.image_url} className="w-full h-auto max-h-[70vh] object-contain rounded-[16px] mx-auto" alt="" />
            <div className="mt-4 text-center"><p className="text-white font-bold text-[16px]">{expandedAd.business_name}</p><p className="text-white/70 text-[13px] mt-1">{expandedAd.description}</p>{expandedAd.whatsapp && (<a href={`https://wa.me/${String(expandedAd.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" className="mt-4 inline-block bg-white text-black rounded-full px-6 py-3 text-[13px] font-bold">💬 WhatsApp: {expandedAd.business_name}</a>)}</div>
          </div>
        </div>
      )}

      {expandedProduct && (
        <div onClick={() => setExpandedProduct(null)} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md grid place-items-center p-3 overflow-y-auto">
          <button onClick={() => setExpandedProduct(null)} className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white grid place-items-center">✕</button>
          <div className="w-full max-w-md bg-white rounded-[20px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative bg-black aspect-[4/3] overflow-hidden">
              <img src={expandedProduct.image_url} className="absolute inset-0 w-full h-full object-cover blur-[24px] scale-110 opacity-60" alt="" />
              <img src={expandedProduct.image_url} className="relative w-full h-full object-contain" alt={expandedProduct.title} />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded-full">{expandedProduct.category}</span>
                {verifiedSellers.has((expandedProduct.seller_name || "").toLowerCase()) && <span className="bg-[#0d9488] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ Verified</span>}
              </div>
              <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur">👁 {viewCounts[expandedProduct.id] || expandedProduct.views || 0} views</div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <h2 className="text-[16px] font-bold leading-tight text-black">{expandedProduct.title}</h2>
                  <p className="text-[12px] text-black/50 mt-1 flex items-center gap-1">📍 {expandedProduct.location} • 🏪 {expandedProduct.seller_name} {verifiedSellers.has((expandedProduct.seller_name || "").toLowerCase()) && <span className="text-[#0d9488]">✓</span>}</p>
                </div>
                <p className="text-[18px] font-bold text-black shrink-0">{expandedProduct.price}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <a href={`https://wa.me/${String(expandedProduct.whatsapp || "").replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${expandedProduct.title} on KSOM - ${window.location.origin}`} target="_blank" className="col-span-2 bg-[#25D366] text-white rounded-full py-3.5 text-[13px] font-bold text-center active:scale-95 transition-transform">💬 WhatsApp Seller</a>
                <button onClick={() => toggleCart(expandedProduct.id)} className={`rounded-full py-3.5 text-[13px] font-bold border active:scale-95 transition-all ${cart.includes(expandedProduct.id) ? "bg-black text-white border-black" : "bg-black/5 text-black border-black/10"}`}>{cart.includes(expandedProduct.id) ? "✓ In Cart" : "🛒 Cart"}</button>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button onClick={() => shareProduct(expandedProduct)} className="bg-black text-white rounded-full py-3 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> Share to Status
                </button>
                <a href={`/seller/${encodeURIComponent(expandedProduct.seller_name)}`} className="bg-white border border-black/10 text-black rounded-full py-3 text-[12px] font-bold text-center active:scale-95 transition-transform">View Seller →</a>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="mt-10 text-center pb-8">
        <p className="text-[12px] tracking-[0.4em] opacity-30 font-light italic select-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>~Primos~</p>
        <p className="text-[10px] tracking-[0.2em] opacity-40 mt-1 uppercase flex items-center justify-center gap-1">Built for 🫵</p>
      </div>

      <style>{`.cats-smooth-v2{scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scroll-padding:0 50%}.cats-smooth-v2::-webkit-scrollbar{display:none}.cats-smooth-v2 button{transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important}`}</style>
    </div>
  );
}