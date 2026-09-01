"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// --- NOTIFICATION BELL - Instagram/YouTube style ---
function NotificationBell({ isDark, onNotification }: { isDark: boolean; onNotification?: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ksm_notifications") || "[]");
    setNotifs(saved);
    setHasNew(saved.filter((n: any) => !n.read).length > 0);
    const channel = supabase.channel('ksom-notif-v10').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
      const newNotif = { id: Date.now().toString(), type: "product", title: "New product on KSOM", message: `${payload.new.title} • ${payload.new.price}`, created_at: new Date().toISOString(), read: false, image: payload.new.image_url };
      const updated = [newNotif, ...JSON.parse(localStorage.getItem("ksm_notifications") || "[]")].slice(0, 20);
      localStorage.setItem("ksm_notifications", JSON.stringify(updated));
      setNotifs(updated); setHasNew(true);
      if (navigator.vibrate) navigator.vibrate(200);
      onNotification?.();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  const markRead = () => {
    const updated = notifs.map((n: any) => ({ ...n, read: true }));
    setNotifs(updated); localStorage.setItem("ksm_notifications", JSON.stringify(updated)); setHasNew(false);
  };
  const unread = notifs.filter((n: any) => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => { setShow(!show); if (!show) markRead(); }} className={`relative w-10 h-10 rounded-full grid place-items-center backdrop-blur border transition-all active:scale-90 ${isDark ? "bg-white/10 border-white/20 text-white hover:bg-white/15" : "bg-black/5 border-black/10 text-black hover:bg-black/10"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 6 9 6 9H0s6-2 6-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
        {hasNew && unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white/20"></span>}
      </button>
      {show && (
        <div className={`absolute bottom-[52px] left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 w-[320px] max-h-[420px] rounded-[20px] border shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden z-[100] backdrop-blur-xl ${isDark ? "bg-[#1e1e1e]/95 border-white/10" : "bg-white/95 border-black/10"}`}>
          <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/5 bg-black/[0.02]"}`}>
            <h3 className={`text-[13px] font-bold ${isDark ? "text-white" : "text-black"}`}>Notifications</h3>
            <button onClick={() => setShow(false)} className={`w-7 h-7 rounded-full grid place-items-center text-[12px] ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"}`}>✕</button>
          </div>
          <div className="overflow-y-auto max-h-[360px]">
            {notifs.length === 0 ? <div className="p-8 text-center"><p className={`text-[12px] font-medium ${isDark ? "text-white/60" : "text-black/50"}`}>No notifications yet</p></div> : notifs.map((n: any) => (
              <div key={n.id} className={`p-3.5 flex gap-3 border-b last:border-0 ${isDark ? "border-white/5" : "border-black/5"} ${!n.read ? (isDark ? "bg-white/[0.04]" : "bg-black/[0.02]") : ""}`}>
                {n.image ? <img src={n.image} className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${isDark ? "bg-white/10" : "bg-black/5"}`}>🛒</div>}
                <div className="flex-1 min-w-0"><p className={`text-[12px] leading-tight ${isDark ? "text-white" : "text-black"}`}><span className="font-bold">{n.title}</span> • {n.message}</p><p className={`text-[10px] mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const WHATSAPP_COMMUNITY_LINK = "https://chat.whatsapp.com/JDF0gdFMiQQKz9GslNGWav";

export default function HomeFinalV10() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [ad, setAd] = useState(0);
  const [active, setActive] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [adverts, setAdverts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedAd, setExpandedAd] = useState<any>(null);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const latestRef = useRef<HTMLDivElement>(null);

  // SEO - D. SEO Setup
  useEffect(() => {
    document.title = "KSOM - KNUST Students Online Market | Buy & Sell on Campus";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'KSOM - KNUST Students Online Market. Buy & Sell phones, laptops, shoes, fashion, books & more on KNUST campus. Verified students, WhatsApp chat, no payment yet.');
    else {
      const m = document.createElement('meta'); m.name = 'description'; m.content = 'KSOM - KNUST Students Online Market. Buy & Sell on campus.'; document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(m.matches ? "dark" : "light");
    setCart(JSON.parse(localStorage.getItem("ksm_cart") || "[]"));
    setViewCounts(JSON.parse(localStorage.getItem("ksm_views") || "{}"));
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      if (data && data.length > 0) {
        setProducts(data);
        localStorage.setItem("ksm_products_cache", JSON.stringify(data));
        // Load real views from supabase if column exists
        const vc: Record<string, number> = {};
        data.forEach((p: any) => { if (p.views) vc[p.id] = p.views; });
        if (Object.keys(vc).length > 0) {
          setViewCounts(prev => ({ ...prev, ...vc }));
        }
      } else setProducts([
        { id: "1", title: "iPhone 13 128GB · Neat", price: "GH₵ 4,200", location: "Ayeduase", image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400", category: "Phones", whatsapp: "233540000001", seller_name: "Prince Phones", views: 124 },
        { id: "2", title: "Study Desk + Chair Combo", price: "GH₵ 380", location: "Kotei", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", category: "Furniture", whatsapp: "233540000002", seller_name: "Kotei Furnitures", views: 89 },
        { id: "3", title: "Nike Air Max 270 · Size 42", price: "GH₵ 550", location: "Boadi", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", category: "Shoes", whatsapp: "233540000003", seller_name: "Sneaker Hub", views: 201 },
      ]);
    });
    supabase.from("adverts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(10).then(({ data }) => { if (data) setAdverts(data); });
    supabase.from("collections").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      if (data && data.length > 0) setCollections(data);
      else setCollections([
        { id: "c1", seller_name: "Prince Phones", description: "iPhones & Laptops", image_url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400", whatsapp: "233540000001" },
        { id: "c2", seller_name: "Sneaker Hub", description: "Original Sneakers", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", whatsapp: "233540000003" },
      ]);
    });
  }, []);

  useEffect(() => {
    const len = adverts.length > 0 ? adverts.length : 3;
    const t = setInterval(() => setAd(p => (p + 1) % len), 3500);
    return () => clearInterval(t);
  }, [adverts.length]);

  const toggleCart = (id: string) => {
    const n = cart.includes(id) ? cart.filter(c => c !== id) : [...cart, id];
    setCart(n); localStorage.setItem("ksm_cart", JSON.stringify(n));
  };

  // B. Views Counter - Track when user sees product
  const incrementView = (id: string) => {
    const newCounts = { ...viewCounts, [id]: (viewCounts[id] || Math.floor(Math.random() * 50 + 20)) + 1 };
    setViewCounts(newCounts);
    localStorage.setItem("ksm_views", JSON.stringify(newCounts));
    // Try to update in Supabase (if views column exists, else ignore)
    supabase.from("products").update({ views: newCounts[id] }).eq("id", id).then(() => { });
  };

  // A. Share Product - Viral WhatsApp Status
  const shareProduct = async (p: any) => {
    const url = `${window.location.origin}/product/${p.id}`;
    const text = `🔥 Check this on KSOM!\n\n📦 ${p.title}\n💰 ${p.price}\n📍 ${p.location}\n\n👉 ${url}\n\nJoin KSOM: ${WHATSAPP_COMMUNITY_LINK}`;
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text, url }); return; } catch { }
    }
    // Fallback to WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const executeSearch = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setTimeout(() => { latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150);
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") executeSearch(); };
  const handleCategoryClick = (e: React.MouseEvent<HTMLButtonElement>, cat: string) => {
    setActive(cat);
    e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const isDark = theme === "dark";
  const cats = ["All", "Phones", "Fashion", "Electronics", "Shoes", "Grocery", "Books"];
  const defaultAds = ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800", "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400"];
  const displayAds = adverts.length > 0 ? adverts.map((a: any) => ({ img: a.image_url || defaultAds[0], title: a.business_name, desc: a.description, wa: a.whatsapp, isPaid: true, full: a })) : defaultAds.map((img, idx) => ({ img, title: ["KSOM Marketplace", "Advertise With Us", "KNUST Students"][idx], desc: ["Buy & Sell on campus", "Reach 10k+ students GH₵20/week", "Verified sellers only"][idx], wa: "", isPaid: false, full: { image_url: img, business_name: ["KSOM Marketplace", "Advertise With Us", "KNUST Students"][idx], description: ["Buy & Sell on campus", "Reach 10k+ students", "Verified sellers only"][idx], whatsapp: "" } }));

  // C. Verified Badge - If seller has collection, they are verified!
  const verifiedSellers = new Set(collections.map(c => c.seller_name.toLowerCase()));

  let filtered = active === "All" ? products : products.filter(p => p.category === active || p.category?.toLowerCase().includes(active.toLowerCase()));
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${isDark ? "bg-[#0f0f0f] text-[#f5f3ef]" : "bg-[#fbfaf8] text-[#121212]"} min-h-screen pb-28 transition-colors`}>
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-[#0f0f0f]/90 border-white/10" : "bg-[#fbfaf8]/90 border-black/10"}`}>
        <div className="px-5 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2.5"><img src="knust-logo.png" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" alt="" /><span className="text-[11px] tracking-[0.2em] uppercase font-medium">KSOM — KNUST</span></div>
          <div className="flex items-center gap-2.5"><span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#0d9488" }}>Prima</span><a href="/login" className={`text-[11px] px-3.5 py-1.5 rounded-full border font-medium ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>Log in</a></div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <h1 className="text-[26px] font-[500] leading-[0.95]">Students' online<br />market</h1>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-3 py-1.5 text-[10px] border shrink ${isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-black/60"}`}>Verified students · Chat on WhatsApp · No payment yet</div>
          <a href={WHATSAPP_COMMUNITY_LINK} target="_blank" className="shrink-0 bg-[#0d9488] text-white text-[11px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">Join →</a>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className={`flex items-center rounded-full px-5 py-3.5 border ${isDark ? "bg-[#1c1c1c] border-white/10" : "bg-white border-black/10"}`}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} enterKeyHint="search" placeholder="Search on KSOM" className={`bg-transparent outline-none text-[13px] flex-1 ${isDark ? "placeholder:text-white/25 text-white" : "placeholder:text-black/30"}`} />
          <button onClick={executeSearch} className={`w-7 h-7 rounded-full grid place-items-center text-[11px] active:scale-90 transition-transform ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>⌕</button>
        </div>
        {search && <p className="text-[10px] mt-2 opacity-50">Searching for "{search}" — {filtered.length} found</p>}
      </div>

      <div className="mt-5 px-5 flex gap-2 overflow-x-auto scrollbar-none cats-smooth-v2">{cats.map(c => <button key={c} onClick={(e) => handleCategoryClick(e, c)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] border transition-all duration-300 ${active === c ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") : (isDark ? "bg-transparent text-white/50 border-white/10" : "bg-white text-black/60 border-black/10")}`}>{c}</button>)}</div>

      <div className="mt-6 px-3">
        <div className={`rounded-[20px] p-2 border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-50">{displayAds[ad]?.isPaid ? `${displayAds[ad]?.title} • AD` : "Advertisement"} • {ad + 1}/{displayAds.length}</span>
            <a href="/advertise" className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>YOUR ADS →</a>
          </div>
          <div onClick={() => setExpandedAd(displayAds[ad]?.full || { image_url: displayAds[ad]?.img, business_name: displayAds[ad]?.title, description: displayAds[ad]?.desc, whatsapp: displayAds[ad]?.wa })} className="rounded-[14px] overflow-hidden aspect-[16/9] relative bg-black cursor-pointer active:scale-[0.98] transition-transform select-none">
            <img src={displayAds[ad]?.img} className="absolute inset-0 w-full h-full object-cover blur-[26px] scale-110 opacity-70" alt="" />
            <img src={displayAds[ad]?.img} className="relative w-full h-full object-contain pointer-events-none" alt="" />
            {displayAds[ad]?.isPaid && <div className="absolute top-3 left-3 bg-yellow-400 text-black text-[9px] font-bold px-2 py-1 rounded-full">AD • {displayAds[ad]?.title}</div>}
            <div className="absolute bottom-3 left-3 flex gap-1">{displayAds.map((_: any, i: number) => <div key={i} className={`h-1 rounded-full transition-all ${i === ad ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}></div>)}</div>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[9px] px-2.5 py-1 rounded-full">Tap to expand 👆</div>
          </div>
          <div className="px-1 pt-2 flex justify-between items-center">
            <p className="text-[11px] opacity-60 truncate pr-2">{displayAds[ad]?.desc || "Reach 10k+ KNUST students"}</p>
            {displayAds[ad]?.isPaid ? <a onClick={(e) => { e.stopPropagation() }} href={`https://wa.me/${String(displayAds[ad]?.wa || "").replace(/[^0-9]/g, '')}`} target="_blank" className="shrink-0 bg-[#25D366] text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Contact</a> : <a href="/advertise" className="shrink-0 bg-black text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Advertise →</a>}
          </div>
        </div>
      </div>

      <div className="mt-8 px-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Featured Collections — {collections.length}</h2>
          <a href="/collections" className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>Book a Spot →</a>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {collections.slice(0, 6).map((c: any) => (
            <a key={c.id} href={`/seller/${encodeURIComponent(c.seller_name)}`} className={`rounded-[18px] overflow-hidden border relative h-[140px] group ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
              <img src={c.image_url} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500" alt={c.seller_name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
              {/* Verified badge on collection */}
              <div className="absolute top-2 left-2 bg-white text-black text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1">✓ Verified</div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-[12px] font-bold leading-tight flex items-center gap-1">{c.seller_name} <span className="w-3 h-3 bg-[#0d9488] rounded-full grid place-items-center text-[8px]">✓</span></p>
                <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{c.description}</p>
                <span className="mt-1.5 inline-block text-[9px] px-2 py-1 rounded-full bg-white text-black font-bold">View Collection →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div ref={latestRef} id="latest-section" className="mt-8 px-5 scroll-mt-24">
        <div className="flex justify-between items-center mb-3"><h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Latest — {filtered.length} items</h2><a href="/sell" className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>+ Sell</a></div>
        <div className="grid gap-3">{filtered.slice(0, 3).map((p: any) => {
          const isVerified = verifiedSellers.has((p.seller_name || "").toLowerCase());
          const views = viewCounts[p.id] || p.views || Math.floor(Math.random() * 200 + 20);
          return (
            <div key={p.id} onClick={() => incrementView(p.id)} className={`flex gap-3 rounded-[18px] p-3 border relative ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
              <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 shrink-0 relative">
                <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                {/* Views eye icon */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> {views}</div>
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${isDark ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"}`}>{p.category}</span>
                      {isVerified && <span className="w-4 h-4 bg-[#0d9488] rounded-full grid place-items-center text-white text-[9px]" title="Verified Seller">✓</span>}
                    </div>
                    <span className="text-[10px] opacity-40">{p.location}</span>
                  </div>
                  <p className="text-[13px] font-medium mt-1.5 leading-tight truncate flex items-center gap-1">{p.title} {isVerified && <span className="text-[#0d9488] text-[10px]">✓</span>}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[13px] font-bold">{p.price}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>{views} views • {views > 100 ? "🔥 Hot" : views > 50 ? "👀 Popular" : "New"}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <a href={`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${p.title} on KSOM`} target="_blank" className="flex-1 bg-[#25D366] text-white text-[11px] font-bold py-2 rounded-full text-center">💬 WhatsApp</a>
                  <button onClick={() => toggleCart(p.id)} className={`px-3 rounded-full text-[11px] font-bold border active:scale-95 transition-all ${cart.includes(p.id) ? "bg-black text-white border-black" : isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}>{cart.includes(p.id) ? "✓" : "🛒"}</button>
                  <button onClick={() => shareProduct(p)} className={`w-9 h-9 rounded-full grid place-items-center border active:scale-90 transition-transform ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}</div>
        <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none pb-2">{filtered.slice(3, 6).map((p: any) => {
          const views = viewCounts[p.id] || p.views || Math.floor(Math.random() * 100 + 10);
          const isVerified = verifiedSellers.has((p.seller_name || "").toLowerCase());
          return (
            <div key={p.id} onClick={() => incrementView(p.id)} className={`min-w-[150px] rounded-[16px] p-2.5 border relative ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
              <div className="h-[100px] rounded-[12px] overflow-hidden bg-black/10 relative"><img src={p.image_url} className="w-full h-full object-cover" alt="" /><div className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full">👁 {views}</div>{isVerified && <div className="absolute top-1 left-1 w-4 h-4 bg-[#0d9488] rounded-full grid place-items-center text-white text-[8px]">✓</div>}</div>
              <p className="text-[11px] font-medium mt-2 truncate flex items-center gap-1">{p.title} {isVerified && <span className="text-[#0d9488] text-[8px]">✓</span>}</p><p className="text-[11px] font-bold mt-0.5">{p.price}</p>
              <div className="flex gap-1 mt-2"><a href={`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}`} target="_blank" className="flex-1 bg-[#25D366] text-white text-[9px] font-bold py-1.5 rounded-full text-center">WA</a><button onClick={() => toggleCart(p.id)} className="flex-1 bg-black text-white text-[9px] py-1.5 rounded-full">Cart</button><button onClick={() => shareProduct(p)} className="w-7 h-7 rounded-full bg-black/5 grid place-items-center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle></svg></button></div>
            </div>
          );
        })}</div>
      </div>

      <div className="mt-8 px-5">
        <div className="rounded-[18px] p-4 border flex justify-between items-center" style={{ background: "#0d9488", borderColor: "#0d9488" }}>
          <div><p className="text-white text-[12px] font-bold">Want to advertise?</p><p className="text-white/80 text-[10px]">Let me run your ads for you</p></div>
          <a href="/advertise" className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-full">Contact Me →</a>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className={`flex items-center gap-1 rounded-full p-1.5 backdrop-blur-[28px] border shadow-[0_12px_32px_rgba(0,0,0,0.15)] ${isDark ? "bg-[#1e1e1e]/80 border-white/10" : "bg-white/80 border-black/10"}`}>
          <a href="/" className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[12px] font-medium shadow-sm ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home</a>
          <NotificationBell isDark={isDark} />
          <a href="/cart" className={`w-10 h-10 rounded-full grid place-items-center backdrop-blur relative border transition-all active:scale-90 ${isDark ? "bg-white/10 text-white border-white/10" : "bg-black/5 text-black border-black/5"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>{cart.length > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-black text-white text-[9px] rounded-full grid place-items-center px-1 font-bold border border-white/20">{cart.length}</span>}</a>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`w-10 h-10 rounded-full grid place-items-center border backdrop-blur font-bold transition-all active:scale-90 ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>{isDark ? "☀" : "☾"}</button>
        </div>
      </div>

      {expandedAd && (
        <div onClick={() => setExpandedAd(null)} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md grid place-items-center p-4">
          <button onClick={() => setExpandedAd(null)} className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white grid place-items-center">✕</button>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <img src={expandedAd.image_url} className="w-full h-auto max-h-[70vh] object-contain rounded-[16px] mx-auto" alt="" />
            <div className="mt-4 text-center">
              <p className="text-white font-bold text-[16px]">{expandedAd.business_name}</p>
              <p className="text-white/70 text-[13px] mt-1">{expandedAd.description}</p>
              {expandedAd.whatsapp && (<a href={`https://wa.me/${String(expandedAd.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" className="mt-4 inline-block bg-white text-black rounded-full px-6 py-3 text-[13px] font-bold">💬 WhatsApp: {expandedAd.business_name}</a>)}
            </div>
          </div>
        </div>
      )}

      <style>{`.cats-smooth-v2{scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scroll-padding:0 50%}.cats-smooth-v2::-webkit-scrollbar{display:none}.cats-smooth-v2 button{transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important}`}</style>
    </div>
  );
}
