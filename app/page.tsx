"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomeFinal() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [ad, setAd] = useState(0);
  const [active, setActive] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [adverts, setAdverts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(m.matches ? "dark" : "light");
    setFavs(JSON.parse(localStorage.getItem("ksm_favs") || "[]"));
    setCart(JSON.parse(localStorage.getItem("ksm_cart") || "[]"));
    supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setProducts(data);
        localStorage.setItem("ksm_products_cache", JSON.stringify(data));
      } else setProducts([
        { id: "1", title: "iPhone 13 128GB · Neat", price: "GH₵ 4,200", location: "Ayeduase", image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400", category: "Phones", whatsapp: "233540000001", seller_name: "Prince Phones" },
        { id: "2", title: "Study Desk + Chair Combo", price: "GH₵ 380", location: "Kotei", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", category: "Furniture", whatsapp: "233540000002", seller_name: "Kotei Furnitures" },
        { id: "3", title: "Nike Air Max 270 · Size 42", price: "GH₵ 550", location: "Boadi", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", category: "Shoes", whatsapp: "233540000003", seller_name: "Sneaker Hub" },
        { id: "4", title: "MacBook Air M1 2020", price: "GH₵ 5,800", location: "Kotei", image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", category: "Laptop", whatsapp: "233540000004", seller_name: "Prince Phones" },
        { id: "5", title: "Lab Coat + Goggles Set", price: "GH₵ 120", location: "Campus", image_url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400", category: "Lab", whatsapp: "233540000005", seller_name: "Lab Essentials" },
        { id: "6", title: "JBL Speaker Flip 6", price: "GH₵ 650", location: "Ayeduase", image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400", category: "Audio", whatsapp: "233540000006", seller_name: "Audio Hub" },
      ]);
    });

    supabase.from("adverts").select("*").eq("status", "approved").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAdverts(data);
    });

    // FETCH APPROVED COLLECTIONS
    supabase.from("collections").select("*").eq("status", "approved").order("created_at", { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) setCollections(data);
      else setCollections([
        { id: "c1", seller_name: "Prince Phones", description: "iPhones & Laptops", image_url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400", whatsapp: "233540000001" },
        { id: "c2", seller_name: "Sneaker Hub", description: "Original Sneakers", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", whatsapp: "233540000003" },
        { id: "c3", seller_name: "Kotei Furnitures", description: "Desks & Chairs", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", whatsapp: "233540000002" },
        { id: "c4", seller_name: "Lab Essentials", description: "Lab Coats & More", image_url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400", whatsapp: "233540000005" },
        { id: "c5", seller_name: "Audio Hub", description: "Speakers & Headsets", image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400", whatsapp: "233540000006" },
        { id: "c6", seller_name: "Fashion Nova KNUST", description: "Trendy Wears", image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400", whatsapp: "233540000007" },
      ]);
    });
  }, []);

  useEffect(() => {
    const len = adverts.length > 0 ? adverts.length : 3;
    const t = setInterval(() => setAd(p => (p + 1) % len), 3500);
    return () => clearInterval(t);
  }, [adverts.length]);

  const toggleFav = (id: string) => {
    const n = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(n); localStorage.setItem("ksm_favs", JSON.stringify(n));
  };
  const toggleCart = (id: string) => {
    const n = cart.includes(id) ? cart.filter(c => c !== id) : [...cart, id];
    setCart(n); localStorage.setItem("ksm_cart", JSON.stringify(n));
  };

  const isDark = theme === "dark";
  const cats = ["All", "Phones", "Fashion", "Electronics", "Shoes", "Grocery", "Books"];
  const defaultAds = ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800", "https://images.unsplash.com/photo-1498049794561-7780e7231666?w=800"];
  const displayAds = adverts.length > 0 ? adverts.map((a: any) => ({ img: a.image_url || defaultAds[0], title: a.business_name, desc: a.description, wa: a.whatsapp, isPaid: true })) : defaultAds.map(img => ({ img, title: "Advertisement", desc: "", wa: "", isPaid: false }));

  let filtered = active === "All" ? products : products.filter(p => p.category === active || p.category?.toLowerCase().includes(active.toLowerCase()));
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${isDark ? "bg-[#0f0f0f] text-[#f5f3ef]" : "bg-[#fbfaf8] text-[#121212]"} min-h-screen pb-28 transition-colors`}>
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-[#0f0f0f]/90 border-white/10" : "bg-[#fbfaf8]/90 border-black/10"}`}>
        <div className="px-5 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2.5"><img src="public/knust-logo.png" className="w-6 h-6 object-contain"></img><span className="text-[11px] tracking-[0.2em] uppercase font-medium">KSOM — KNUST</span></div>
          <div className="flex items-center gap-2.5"><span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#0d9488" }}>Prima</span><a href="/login" className={`text-[11px] px-3.5 py-1.5 rounded-full border font-medium ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>Log in</a></div>
        </div>
      </div>

      <div className="px-5 pt-5"><h1 className="text-[26px] font-[300] leading-[0.95]">Students online<br />market.</h1><div className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[10px] border ${isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-black/60"}`}>Verified KNUST students · Chat on WhatsApp · No payment yet</div></div>

      <div className="px-5 mt-5">
        <div className={`flex items-center rounded-full px-5 py-3.5 border ${isDark ? "bg-[#1c1c1c] border-white/10" : "bg-white border-black/10"}`}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search on KSOM" className={`bg-transparent outline-none text-[13px] flex-1 ${isDark ? "placeholder:text-white/25 text-white" : "placeholder:text-black/30"}`} />
          <div className={`w-7 h-7 rounded-full grid place-items-center text-[11px] ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>⌕</div>
        </div>
        {search && <p className="text-[10px] mt-2 opacity-50">Searching for "{search}" — {filtered.length} found</p>}
      </div>

      <div className="mt-5 px-5 flex gap-2 overflow-x-auto scrollbar-none">{cats.map(c => <button key={c} onClick={() => setActive(c)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] border transition ${active === c ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") : (isDark ? "bg-transparent text-white/50 border-white/10" : "bg-white text-black/60 border-black/10")}`}>{c}</button>)}</div>

      <div className="mt-6 px-3"><div className={`rounded-[20px] p-2 border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}><div className="flex justify-between items-center px-3 py-2"><span className="text-[10px] tracking-[0.2em] uppercase opacity-50">{displayAds[ad]?.isPaid ? `${displayAds[ad]?.title} • AD` : "Advertisement"}</span><a href="/advertise" className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>YOUR ADS →</a></div><div className="rounded-[14px] overflow-hidden h-[200px] relative bg-black"><div className="flex h-full transition-transform duration-[900ms]" style={{ transform: `translateX(-${ad * 100}%)` }}>{displayAds.map((item: any, i) => <div key={i} className="min-w-full h-full relative"><img src={item.img} className="w-full h-full object-cover" alt="" />{item.isPaid && <div className="absolute top-3 left-3 bg-yellow-400 text-black text-[9px] font-bold px-2 py-1 rounded-full">AD • {item.title}</div>}</div>)}</div><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div><div className="absolute bottom-3 left-3 flex gap-1">{displayAds.map((_: any, i: number) => <div key={i} className={`h-1 rounded-full ${i === ad ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}></div>)}</div>{displayAds[ad]?.isPaid ? <a href={`https://wa.me/${String(displayAds[ad]?.wa || "").replace(/[^0-9]/g, '')}`} target="_blank" className="absolute bottom-3 right-3 bg-[#25D366] text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Contact</a> : <a href="/advertise" className="absolute bottom-3 right-3 bg-white text-black text-[10px] px-3 py-1.5 rounded-full font-bold">Advertise With Me</a>}</div></div></div>

      {/* === NEW COLLECTIONS SECTION - AFTER AD BOARD === */}
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
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-[12px] font-bold leading-tight">{c.seller_name}</p>
                <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{c.description}</p>
                <span className="mt-1.5 inline-block text-[9px] px-2 py-1 rounded-full bg-white text-black font-bold">View Collection →</span>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[10px] opacity-40 mt-2 text-center">Tap seller name to see only their items. No cart/fav here.</p>
      </div>

      <div className="mt-8 px-5"><div className="flex justify-between items-center mb-3"><h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Latest — {filtered.length} items</h2><a href="/sell" className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>+ Sell</a></div>
        <div className="grid gap-3">{filtered.slice(0, 3).map((p: any) => <div key={p.id} className={`flex gap-3 rounded-[18px] p-3 border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}><div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 shrink-0"><img src={p.image_url} className="w-full h-full object-cover" alt="" /></div><div className="flex-1 flex flex-col justify-between"><div><div className="flex justify-between"><span className={`text-[9px] px-2 py-0.5 rounded-full border ${isDark ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"}`}>{p.category}</span><span className="text-[10px] opacity-40">{p.location}</span></div><p className="text-[13px] font-medium mt-1.5 leading-tight">{p.title}</p><p className="text-[13px] font-bold mt-1">{p.price}</p></div><div className="flex gap-2 mt-2"><a href={`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${p.title} on KSOM`} target="_blank" className="flex-1 bg-[#25D366] text-white text-[11px] font-bold py-2 rounded-full text-center">💬 WhatsApp</a><button onClick={() => toggleCart(p.id)} className={`w-9 h-9 rounded-full grid place-items-center border ${cart.includes(p.id) ? "bg-black text-white" : isDark ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"}`}>🛒</button><button onClick={() => toggleFav(p.id)} className={`w-9 h-9 rounded-full grid place-items-center border ${favs.includes(p.id) ? "bg-red-500 text-white border-red-500" : isDark ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"}`}>♡</button></div></div></div>)}</div>
        <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none pb-2">{filtered.slice(3, 6).map((p: any) => <div key={p.id} className={`min-w-[150px] rounded-[16px] p-2.5 border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}><div className="h-[100px] rounded-[12px] overflow-hidden bg-black/10"><img src={p.image_url} className="w-full h-full object-cover" alt="" /></div><p className="text-[11px] font-medium mt-2 truncate">{p.title}</p><p className="text-[11px] font-bold mt-0.5">{p.price}</p><div className="flex gap-1 mt-2"><a href={`https://wa.me/${String(p.whatsapp || "").replace(/[^0-9]/g, '')}`} target="_blank" className="flex-1 bg-[#25D366] text-white text-[9px] font-bold py-1.5 rounded-full text-center">WA</a><button onClick={() => toggleCart(p.id)} className="flex-1 bg-black text-white text-[9px] py-1.5 rounded-full">Cart</button></div></div>)}</div>
      </div>

      <div className="mt-8 px-5">
        <div className="rounded-[18px] p-4 border flex justify-between items-center" style={{ background: "#0d9488", borderColor: "#0d9488" }}>
          <div><p className="text-white text-[12px] font-bold">Want to advertise?</p><p className="text-white/80 text-[10px]">Let me run your ads for you</p></div>
          <a href="/advertise" className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-full">Contact Me →</a>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"><div className="flex items-center gap-1 rounded-full p-1.5 backdrop-blur-[28px] border shadow-[0_12px_32px_rgba(0,0,0,0.15)] bg-white/10 border-white/20"><a href="/" className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[12px] font-medium shadow-sm ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><span>⌂</span> Home</a><a href="/favorites" className={`w-10 h-10 rounded-full grid place-items-center backdrop-blur relative ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-black/5 text-black border border-black/10"}`}>♡{favs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full grid place-items-center">{favs.length}</span>}</a><a href="/cart" className={`w-10 h-10 rounded-full grid place-items-center backdrop-blur relative ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-black/5 text-black border border-black/10"}`}>🛒{cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] rounded-full grid place-items-center">{cart.length}</span>}</a><button onClick={() => setTheme(isDark ? "light" : "dark")} className={`w-10 h-10 rounded-full grid place-items-center border backdrop-blur font-bold ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>{isDark ? "☀" : "☾"}</button></div></div>
      <style>{`button{-webkit-tap-highlight-color:transparent} .scrollbar-none::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}