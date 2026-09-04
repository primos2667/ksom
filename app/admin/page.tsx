"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/compressImage";


function MorningNewsUploader({ onUploaded }: { onUploaded: () => void }) {
  const [form, setForm] = useState({ title: "", summary: "", source: "BBC", url: "", category: "Tech", image_url: "" });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      // 🔥 Auto compress like sell page - 5MB → ~150KB for fast site!
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = "news-" + Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setForm({ ...form, image_url: data.publicUrl });
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title || !form.summary || !form.url || !form.image_url) { alert("Fill all fields + image"); return; }
    const supabase = createClient();
    const { error } = await supabase.from("morning_news").insert([{ ...form, created_at: new Date().toISOString() }]);
    if (error) alert(error.message);
    else {
      alert("☀️ Morning news added! Will show on homepage top!");
      setForm({ title: "", summary: "", source: "BBC", url: "", category: "Tech", image_url: "" });
      onUploaded();
    }
  };

  return (
    <div className="mt-4 grid gap-3">
      <div className="rounded-[12px] border border-dashed p-3 text-center">
        {form.image_url ? <img src={form.image_url} className="w-full h-32 object-cover rounded-[12px] mb-2" /> : <p className="text-xs opacity-40 py-6">News image (210px height, bigger than advert)</p>}
        <label className="inline-block px-4 py-2 rounded-full bg-black text-white text-xs cursor-pointer">{uploading ? "Uploading..." : "Upload Image"}<input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>
      </div>
      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. Black Stars qualify!" className="w-full rounded-full px-4 py-2.5 border text-sm" />
      <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Summary 1 line" className="w-full rounded-[16px] px-4 py-2.5 border text-sm h-20" />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Source BBC, TechCrunch" className="w-full rounded-full px-4 py-2.5 border text-sm" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-2.5 border text-sm">
          <option>Tech</option><option>Sports</option><option>Education</option><option>Ghana</option><option>Entertainment</option><option>Campus</option>
        </select>
      </div>
      <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="Full article URL https://bbc.com/..." className="w-full rounded-full px-4 py-2.5 border text-sm" />
      <button onClick={submit} className="w-full bg-red-500 text-white rounded-full py-3 text-sm font-bold">☀️ Post Morning News</button>
      <p className="text-[10px] opacity-40 text-center">Genre tip: Tech/Sports/Scholarship = highest open rate for KNUST students!</p>
    </div>
  );
}


export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [adverts, setAdverts] = useState<any[]>([]);
  const [morningNews, setMorningNews] = useState<any[]>([]);
  const [tab, setTab] = useState<"products" | "collections" | "adverts" | "news">("products");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 🔒 Admin email hidden in .env.local - not visible in code!
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "primos7662@gmail.com";

  useEffect(() => {
    setLoginEmail(ADMIN_EMAIL);
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setUserEmail(user.email || "");
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setLoginError(`Access denied! Only admin can access. You are ${user.email}`);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    loadAll();
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPass,
    });
    setLoginLoading(false);
    if (error) {
      setLoginError(error.message);
    } else {
      if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setLoginError(`This email is not admin! Only admin allowed. You are ${data.user?.email}`);
        await supabase.auth.signOut();
      } else {
        setIsLoggedIn(true);
        setUserEmail(data.user.email || "");
        loadAll();
      }
    }
  };

  const loadAll = async () => {
    const supabase = createClient();
    setLoading(true);
    const [prodRes, collRes, advertRes, newsRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("collections").select("*").order("created_at", { ascending: false }),
      supabase.from("adverts").select("*").order("created_at", { ascending: false }),
      supabase.from("morning_news").select("*").order("created_at", { ascending: false })
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (collRes.data) setCollections(collRes.data);
    if (advertRes.data) setAdverts(advertRes.data);
    if (newsRes.data) setMorningNews(newsRes.data);
    setLoading(false);
  };

  const [cleaning, setCleaning] = useState(false);
  const [oldCount, setOldCount] = useState(0);
  const [storageInfo, setStorageInfo] = useState<{ count: number, percent: number, nextClean: string, max: number } | null>(null);

  useEffect(() => {
    if (isLoggedIn) checkOldProducts();
  }, [isLoggedIn, products]);

  const checkOldProducts = async () => {
    const supabase = createClient();
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    setOldCount(count || 0);
    const total = products.length;
    const MAX = 3000; // ✅ FIXED: Was 400, now 3000!
    const percent = Math.floor((total / MAX) * 100);
    const now = new Date();
    const cleanDates = [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 3, 1), new Date(now.getFullYear(), 6, 1), new Date(now.getFullYear(), 9, 1)];
    let next = cleanDates.find(d => d > now) || new Date(now.getFullYear() + 1, 0, 1);
    setStorageInfo({ count: total, percent, nextClean: next.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" }), max: MAX });
  };

  const cleanOldProducts = async () => {
    if (!confirm(`🧹 Delete ${oldCount} products older than 90 days? This will delete from DATABASE + STORAGE! Cannot undo!`)) return;
    setCleaning(true);
    const supabase = createClient();
    try {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: oldProducts } = await supabase.from("products").select("id, image_url").lt("created_at", cutoff);
      if (!oldProducts || oldProducts.length === 0) {
        alert("No old products found!");
        setCleaning(false);
        return;
      }
      const imagePaths = oldProducts.map((p: any) => {
        if (p.image_url?.includes("product-images")) {
          return p.image_url.split("/product-images/")[1]?.split("?")[0];
        }
        return null;
      }).filter(Boolean);
      if (imagePaths.length > 0) {
        await supabase.storage.from("product-images").remove(imagePaths);
      }
      const { error } = await supabase.from("products").delete().lt("created_at", cutoff);
      if (error) throw error;
      alert(`✅ Cleaned ${oldProducts.length} old products from DATABASE + STORAGE! Free space saved!`);
      loadAll();
      checkOldProducts();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setCleaning(false);
  };

  const deleteProduct = async (id: string, image_url: string) => {
    if (!confirm("🗑️ Delete this product?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else {
      if (image_url?.includes("product-images")) {
        const path = image_url.split("/product-images/")[1]?.split("?")[0];
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete collection?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (!error) setCollections(prev => prev.filter(c => c.id !== id));
  };

  const deleteNews = async (id: string) => {
    if (!confirm("Delete this morning news?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("morning_news").delete().eq("id", id);
    if (!error) setMorningNews(prev => prev.filter(n => n.id !== id));
  };

  const deleteAdvert = async (id: string) => {
    if (!confirm("Delete advert?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("adverts").delete().eq("id", id);
    if (!error) setAdverts(prev => prev.filter(a => a.id !== id));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserEmail("");
  };

  if (!isLoggedIn && !loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] grid place-items-center p-5">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[24px] p-6 border shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[18px] font-bold dark:text-white">Admin Login</h1>
            <a href="/" className="text-[10px] px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
          </div>
          <p className="text-[11px] opacity-60 mb-4 dark:text-white/60">🔒 Admin only - email hidden in .env</p>

          <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Admin email" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] dark:bg-zinc-800 text-[13px] outline-none dark:text-white mb-3" />
          <input value={loginPass} onChange={e => setLoginPass(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] dark:bg-zinc-800 text-[13px] outline-none dark:text-white" />

          {loginError && <p className="text-[11px] mt-3 p-2.5 rounded-[12px] bg-red-500 text-white text-center">{loginError}</p>}

          <button onClick={handleLogin} disabled={loginLoading} className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-full text-[13px] font-bold">
            {loginLoading ? "Logging in..." : "Login as Admin →"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#0f0f0f] text-white"><p>Loading admin...</p></div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold dark:text-white">Admin Panel</h1>
          <p className="text-xs opacity-60 mt-1 dark:text-white/60">{userEmail} • {products.length} prods • {collections.length} colls • {storageInfo?.percent || 0}% full</p>
          <p className="text-[10px] text-green-600 font-bold mt-1">🔒 Next clean: {storageInfo?.nextClean} • {oldCount} old (over 90d) • Max 3000</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cleanOldProducts} disabled={cleaning || oldCount === 0} className={`text-xs px-4 py-2 rounded-full font-bold ${cleaning ? "bg-gray-400 text-white" : oldCount > 0 ? "bg-[#0d9488] text-white" : "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40"}`}>
            {cleaning ? "Cleaning..." : `🧹 Clean ${oldCount} old`}
          </button>
          <button onClick={handleLogout} className="text-xs px-4 py-2 rounded-full bg-red-500 text-white">Logout</button>
          <a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
        </div>
      </div>

      {/* Storage Bar - FIXED to 3000 */}
      {storageInfo && (
        <div className="max-w-4xl mx-auto mt-4 p-3 rounded-[16px] border flex justify-between items-center"
          style={{ background: storageInfo.percent >= 80 ? "#fef2f2" : storageInfo.percent >= 60 ? "#fefce8" : "#f0fdf4", borderColor: storageInfo.percent >= 80 ? "#fecaca" : storageInfo.percent >= 60 ? "#fde68a" : "#bbf7d0" }}>
          <div>
            <p className="text-[12px] font-bold" style={{ color: storageInfo.percent >= 80 ? "#dc2626" : storageInfo.percent >= 60 ? "#ca8a04" : "#15803d" }}>
              {storageInfo.percent >= 80 ? `🚫 ${storageInfo.percent}% FULL - Uploads Paused` : `📦 ${storageInfo.percent}% Used (${storageInfo.count}/${storageInfo.max || 3000})`}
            </p>
            <p className="text-[10px] opacity-60">Auto-clean every 3 months (Jan, Apr, Jul, Oct) • Deletes DB + Storage • Max 3000</p>
          </div>
          <div className="text-[20px]">{storageInfo.percent >= 80 ? "🚫" : storageInfo.percent >= 60 ? "⚠️" : "✅"}</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-6 flex gap-2 flex-wrap">
        <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-full text-xs font-bold border ${tab === "products" ? "bg-black text-white border-black dark:bg-white dark:text-black" : "bg-white text-black/60 border-black/10 dark:bg-zinc-900 dark:text-white/60"}`}>Products ({products.length})</button>
        <button onClick={() => setTab("collections")} className={`px-4 py-2 rounded-full text-xs font-bold border ${tab === "collections" ? "bg-black text-white border-black dark:bg-white dark:text-black" : "bg-white text-black/60 border-black/10 dark:bg-zinc-900 dark:text-white/60"}`}>Collections ({collections.length})</button>
        <button onClick={() => setTab("adverts")} className={`px-4 py-2 rounded-full text-xs font-bold border ${tab === "adverts" ? "bg-black text-white border-black dark:bg-white dark:text-black" : "bg-white text-black/60 border-black/10 dark:bg-zinc-900 dark:text-white/60"}`}>Adverts ({adverts.length})</button>
        <button onClick={() => setTab("news")} className={`px-4 py-2 rounded-full text-xs font-bold border ${tab === "news" ? "bg-red-500 text-white border-red-500" : "bg-white text-black/60 border-black/10 dark:bg-zinc-900 dark:text-white/60"}`}>☀️ Morning News ({morningNews.length})</button>
      </div>

      {tab === "news" && (
        <div className="max-w-4xl mx-auto mt-4 p-4 rounded-[18px] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10">
          <h3 className="text-sm font-bold dark:text-white">☀️ Upload Morning News (Bait for DAU!)</h3>
          <p className="text-[11px] opacity-60 mt-1 dark:text-white/60">3 news daily, bigger than advert (210px). Students open for news, stay for market!</p>
          <MorningNewsUploader onUploaded={() => loadAll()} />
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-6 grid gap-3">
        {tab === "products" && products.map((p: any) => <div key={p.id} className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 flex gap-3">
          <img src={p.image_url} className="w-20 h-20 rounded-[12px] object-cover bg-black/5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate dark:text-white">{p.title}</p>
            <p className="text-[12px] font-bold mt-1 dark:text-white">{p.price} • {p.category}</p>
            <div className="flex gap-2 mt-2">
              <a href={`https://wa.me/${String(p.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" className="text-[10px] px-3 py-1 rounded-full bg-[#25D366] text-white">WA</a>
              <button onClick={() => deleteProduct(p.id, p.image_url)} className="text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">🗑️ Delete</button>
            </div>
          </div>
        </div>)}

        {tab === "collections" && collections.map((c: any) => <div key={c.id} className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border flex gap-3">
          <img src={c.image_url} className="w-20 h-20 rounded-[12px] object-cover" />
          <div className="flex-1">
            <p className="text-[13px] font-bold dark:text-white">{c.seller_name}</p>
            <button onClick={() => deleteCollection(c.id)} className="mt-2 text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">Delete</button>
          </div>
        </div>)}

        {tab === "adverts" && adverts.map((a: any) => <div key={a.id} className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border flex gap-3">
          <img src={a.image_url} className="w-20 h-20 rounded-[12px] object-cover" />
          <div className="flex-1">
            <p className="text-[13px] font-bold dark:text-white">{a.business_name}</p>
            <button onClick={() => deleteAdvert(a.id)} className="mt-2 text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">Delete</button>
          </div>
        </div>)}

        {tab === "news" && morningNews.map((n: any) => <div key={n.id} className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border flex gap-3">
          <img src={n.image_url} className="w-20 h-20 rounded-[12px] object-cover" />
          <div className="flex-1">
            <p className="text-[13px] font-bold dark:text-white">{n.title}</p>
            <p className="text-[10px] opacity-60 dark:text-white/60">{n.category} • {n.source} • {n.summary?.slice(0, 40)}</p>
            <button onClick={() => deleteNews(n.id)} className="mt-2 text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">Delete</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
