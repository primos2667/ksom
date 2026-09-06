"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/compressImage";

export default function NewsAdminPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState({ title: "", summary: "", source: "BBC", url: "", category: "Tech", image_url: "" });
  const [uploading, setUploading] = useState(false);

  // 🔒 SIMPLE NEWS ADMIN - No Supabase Auth needed!
  // Set in .env.local:
  // NEXT_PUBLIC_NEWS_ADMIN_EMAIL=newsadmin@gmail.com
  // NEXT_PUBLIC_NEWS_ADMIN_PASSWORD=primanews123
  // Then just enter those on login page - no need to create user in Supabase!
  const NEWS_ADMIN_EMAIL = process.env.NEXT_PUBLIC_NEWS_ADMIN_EMAIL || "newsadmin@gmail.com";
  const NEWS_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_NEWS_ADMIN_PASSWORD || "primanews123";
  const MAIN_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "primos7662@gmail.com";

  useEffect(() => {
    setLoginEmail(NEWS_ADMIN_EMAIL);
    // Check if already logged in via localStorage
    const savedLogin = localStorage.getItem("ksom-news-admin-logged");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
      loadNews();
    } else {
      setLoading(false);
    }
  }, []);

  const loadNews = async () => {
    const supabase = createClient();
    setLoading(true);
    const { data } = await supabase.from("morning_news").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNews(data);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoginError("");
    // Simple check - no Supabase Auth!
    const emailOk = loginEmail.toLowerCase().trim() === NEWS_ADMIN_EMAIL.toLowerCase().trim() || loginEmail.toLowerCase().trim() === MAIN_ADMIN_EMAIL.toLowerCase().trim();
    const passOk = loginPass === NEWS_ADMIN_PASSWORD;

    // Also allow main admin to login with his Supabase password as fallback
    if (emailOk && passOk) {
      setIsLoggedIn(true);
      localStorage.setItem("ksom-news-admin-logged", "true");
      localStorage.setItem("ksom-news-admin-email", loginEmail);
      loadNews();
    } else {
      // Try Supabase Auth as fallback for main admin
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });
        if (!error && data.user) {
          const allowed = [NEWS_ADMIN_EMAIL.toLowerCase(), MAIN_ADMIN_EMAIL.toLowerCase()];
          if (allowed.includes(data.user.email?.toLowerCase() || "")) {
            setIsLoggedIn(true);
            localStorage.setItem("ksom-news-admin-logged", "true");
            loadNews();
            return;
          }
        }
      } catch { }

      setLoginError(`Wrong email or password! Use: ${NEWS_ADMIN_EMAIL} / ${NEWS_ADMIN_PASSWORD}. You entered: ${loginEmail}`);
    }
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = "news-" + Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setForm({ ...form, image_url: data.publicUrl });
      } else {
        alert(error.message);
      }
    } catch (err: any) {
      alert(err.message);
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
      loadNews();
    }
  };

  const deleteNews = async (id: string, image_url?: string) => {
    if (!confirm("🗑️ Delete this morning news?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("morning_news").delete().eq("id", id);
    if (error) alert(error.message);
    else {
      if (image_url?.includes("product-images")) {
        const path = image_url.split("/product-images/")[1]?.split("?")[0];
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("ksom-news-admin-logged");
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => { });
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] grid place-items-center p-5">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[24px] p-6 border shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[18px] font-bold dark:text-white">☀️ News Admin</h1>
              <p className="text-[11px] opacity-60 dark:text-white/60">Upload morning news only</p>
            </div>
            <a href="/" className="text-[10px] px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
          </div>
          <div className="p-3 rounded-[12px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
            <p className="text-[11px] text-green-700 dark:text-green-300">🔑 <span className="font-bold">Simple Login:</span> Use email & password</p>
            <p className="text-[10px] mt-1 opacity-70">Email: {NEWS_ADMIN_EMAIL}</p>
            <p className="text-[10px] opacity-70">Password: {NEWS_ADMIN_PASSWORD.replace(/./g, "*")} (hidden)</p>
          </div>

          <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="News admin email" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] dark:bg-zinc-800 text-[13px] outline-none dark:text-white mb-3" />
          <input value={loginPass} onChange={e => setLoginPass(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] dark:bg-zinc-800 text-[13px] outline-none dark:text-white" onKeyDown={e => e.key === "Enter" && handleLogin()} />

          {loginError && <p className="text-[11px] mt-3 p-2.5 rounded-[12px] bg-red-500 text-white text-center">{loginError}</p>}

          <button onClick={handleLogin} className="w-full mt-4 bg-red-500 text-white py-3.5 rounded-full text-[13px] font-bold">
            Login as News Admin →
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#0f0f0f] text-white"><p>Loading news admin...</p></div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28">
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl font-bold dark:text-white">☀️ Morning News Uploader</h1>
          <p className="text-xs opacity-60 mt-1 dark:text-white/60">Only news - no products/adverts access • {news.length} news • Logged as {loginEmail}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="text-xs px-4 py-2 rounded-full bg-red-500 text-white">Logout</button>
          <a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-6 p-4 rounded-[18px] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10">
        <h3 className="text-sm font-bold dark:text-white">☀️ Upload Morning News</h3>
        <p className="text-[11px] opacity-60 mt-1 dark:text-white/60">3 news daily, 210px height. Auto compresses to KB for fast site!</p>

        <div className="mt-4 grid gap-3">
          <div className="rounded-[12px] border border-dashed p-3 text-center">
            {form.image_url ? <img src={form.image_url} className="w-full h-32 object-cover rounded-[12px] mb-2" /> : <p className="text-xs opacity-40 py-6">News image (will auto convert to KB)</p>}
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-6 grid gap-3">
        <h3 className="text-sm font-bold dark:text-white">Recent News ({news.length}) - Tap delete to remove</h3>
        {news.map((n: any) => <div key={n.id} className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border flex gap-3">
          <img src={n.image_url} className="w-20 h-20 rounded-[12px] object-cover bg-black/5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold dark:text-white leading-tight">{n.title}</p>
            <p className="text-[11px] mt-1 dark:text-white/70 line-clamp-2">{n.summary}</p>
            <p className="text-[10px] opacity-60 mt-1 dark:text-white/60">{n.category} • {n.source} • <a href={n.url} target="_blank" className="underline text-blue-500">Link</a></p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => deleteNews(n.id, n.image_url)} className="text-[11px] px-4 py-1.5 rounded-full bg-red-500 text-white font-bold">🗑️ Delete News</button>
              <span className="text-[9px] px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 self-center">{new Date(n.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>)}
        {news.length === 0 && <p className="text-[12px] opacity-40 text-center py-10">No news yet. Upload 3 above!</p>}
      </div>
    </div>
  );
}