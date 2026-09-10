"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/compressImage";

export default function SellPage() {
  const router = useRouter();
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isVerifiedCollection, setIsVerifiedCollection] = useState<boolean>(false);
  const [form, setForm] = useState({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });
  const [storageStatus, setStorageStatus] = useState<{ blocked: boolean; count: number; max: number; percent: number; nextClean: string; daysToClean: number } | null>(null);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(true);
  const [sellerCount, setSellerCount] = useState<number>(0);
  const MAX_PER_SELLER = isVerifiedCollection ? 30 : 10;

  useEffect(() => {
    const seller = localStorage.getItem("ksm_is_seller");
    const id = localStorage.getItem("ksm_seller_id") || "";
    if (seller !== "true" || !id.toLowerCase().endsWith("/ksom")) {
      router.push("/login");
    } else {
      setIsSeller(true);
      const savedSellerName = localStorage.getItem("ksm_seller_name") || "";
      const savedWhatsapp = localStorage.getItem("ksm_seller_whatsapp") || localStorage.getItem("ksm_whatsapp") || "";
      if (savedSellerName) setForm(prev => ({ ...prev, seller_name: savedSellerName }));
      if (savedWhatsapp) {
        setForm(prev => ({ ...prev, whatsapp: savedWhatsapp }));
        setTimeout(() => checkSellerCount(savedWhatsapp), 500);
      }
      checkCollectionAndLock(savedSellerName);
      checkStorageLimit();
    }
  }, [router]);

  const checkCollectionAndLock = async (sellerName: string) => {
    if (!sellerName) { setIsVerifiedCollection(false); return; }
    try {
      const supabase = createClient();
      const { data } = await supabase.from("collections").select("*").eq("seller_name", sellerName).eq("status", "approved").maybeSingle();
      if (data) {
        setIsVerifiedCollection(true);
        localStorage.setItem("ksm_has_collection", "true");
      } else {
        setIsVerifiedCollection(false);
        localStorage.removeItem("ksm_has_collection");
      }
    } catch { setIsVerifiedCollection(false); }
  };

  const checkSellerCount = async (whatsapp: string) => {
    if (!whatsapp) return 0;
    try {
      const supabase = createClient();
      const cleanWa = whatsapp.replace(/[^0-9]/g, '').slice(-9);
      const { data } = await supabase.from("products").select("whatsapp");
      const count = data?.filter((p: any) => {
        const wa = String(p.whatsapp || "").replace(/[^0-9]/g, '').slice(-9);
        return wa === cleanWa;
      }).length || 0;
      setSellerCount(count);
      return count;
    } catch { return 0; }
  };

  const checkStorageLimit = async () => {
    try {
      const supabase = createClient();
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      const productCount = count || 0;
      const MAX_PRODUCTS = 3000;
      const LIMIT_THRESHOLD = Math.floor(MAX_PRODUCTS * 0.8);
      const percent = Math.floor((productCount / MAX_PRODUCTS) * 100);
      const blocked = productCount >= LIMIT_THRESHOLD;
      const now = new Date();
      const currentYear = now.getFullYear();
      const cleanDates = [new Date(currentYear, 0, 1), new Date(currentYear, 3, 1), new Date(currentYear, 6, 1), new Date(currentYear, 9, 1)];
      let nextClean = cleanDates.find(d => d > now);
      if (!nextClean) nextClean = new Date(currentYear + 1, 0, 1);
      const daysToClean = Math.ceil((nextClean.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setStorageStatus({ blocked, count: productCount, max: MAX_PRODUCTS, percent, nextClean: nextClean.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" }), daysToClean });
    } catch (e) { console.error(e); }
    setCheckingStorage(false);
  };

  const handleImageUpload = async (e: any) => {
    if (storageStatus?.blocked) { alert(`🚫 Storage 80% full! Next clean on ${storageStatus.nextClean}`); return; }
    const file = e.target.files[0]; if (!file) return; setUploading(true);
    try {
      const supabase = createClient();
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (error) { const local = URL.createObjectURL(compressedFile); setImageUrl(local); }
      else { const { data: pub } = supabase.storage.from("product-images").getPublicUrl(fileName); setImageUrl(pub.publicUrl); }
    } catch (err: any) { const local = URL.createObjectURL(file); setImageUrl(local); }
    setUploading(false);
  };

  const submit = async () => {
    if (loading) return;
    if (storageStatus?.blocked) { alert(`🚫 KSOM Storage is ${storageStatus.percent}% full!`); return; }
    const lockedSellerName = localStorage.getItem("ksm_seller_name") || "";
    const lockedWhatsapp = localStorage.getItem("ksm_seller_whatsapp") || localStorage.getItem("ksm_whatsapp") || "";
    if (!lockedSellerName || !lockedWhatsapp) {
      alert("❌ Login data missing! Please logout and login again at /login");
      router.push("/login");
      return;
    }
    let verifiedCollection = false;
    try {
      const supabaseCheck = createClient();
      const { data } = await supabaseCheck.from("collections").select("id").eq("seller_name", lockedSellerName).eq("status", "approved").maybeSingle();
      if (data) verifiedCollection = true;
    } catch { }
    const finalSellerName = lockedSellerName;
    const finalWhatsapp = lockedWhatsapp;
    const maxAllowed = verifiedCollection ? 30 : 10;

    if (!form.title || !form.price) { alert("Fill title, price"); return; }
    if (!imageUrl) { alert("Please upload image first"); return; }
    if (imageUrl.startsWith("blob:")) { alert("Image not fully uploaded yet!"); return; }

    setLoading(true);
    const supabase = createClient();
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
    if ((count || 0) >= Math.floor(3000 * 0.8)) {
      setLoading(false); alert(`🚫 Just reached 80% limit!`); checkStorageLimit(); return;
    }
    const myCount = await checkSellerCount(finalWhatsapp);
    if (myCount >= maxAllowed) {
      setLoading(false);
      if (verifiedCollection) {
        alert(`🚫 You have reached max ${maxAllowed} products (Collection limit)! \nYou have ${myCount} items. Delete sold items at /seller/${finalSellerName} to free slots!`);
      } else {
        alert(`🚫 You have reached max ${maxAllowed} products! \n \nYou have ${myCount} items on KSOM. \n \n💡 Want 20 more slots?\n \nBook a collection at /collections for GH₵ 50 → Get 30 slots! 🚀`);
      }
      return;
    }

    const payload: any = {
      title: form.title,
      price: form.price,
      category: form.category,
      location: form.location,
      whatsapp: finalWhatsapp,
      seller_name: finalSellerName,
      image_url: imageUrl,
      views: 0,
    };

    const { error } = await supabase.from("products").insert([payload]);
    setLoading(false);
    if (error) { alert(error.message); }
    else {
      localStorage.setItem("ksom_last_post", JSON.stringify({ title: form.title, time: Date.now() }));
      setShowSuccess(true); checkStorageLimit();
      try { fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New on KSOM! 🚀', body: `${form.title} • ${form.price}`, image: imageUrl, productId: Date.now().toString() }) }).catch(() => { }); } catch { }
    }
  };

  const handleShareWhatsApp = () => {
    const waMessage = `🚀 NEW ON KSOM!\\n\\n📦 ${form.title}\\n💰 ${form.price}\\n📍 ${form.location}\\n🏪 ${form.seller_name}\\nCheck: https://ksom-omega.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, "_blank");
    setShowSuccess(false); setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: form.whatsapp, seller_name: form.seller_name }); setImageUrl(""); router.push("/");
  };
  const handleDone = () => { setShowSuccess(false); setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: form.whatsapp, seller_name: form.seller_name }); setImageUrl(""); router.push("/"); };

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28">
        <div className="max-w-md mx-auto animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded-full"></div>
            <div className="h-6 w-16 bg-black/10 dark:bg-white/10 rounded-full"></div>
          </div>
          <div className="mt-4 h-12 w-full bg-black/5 dark:bg-white/5 rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28 transition-colors duration-200">
      {/* ORIGINAL DESIGN - Sell on KSOM + My Shop + Home - As in your screenshot */}
      <div className="flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-[22px] font-bold dark:text-white tracking-tight">Sell on KSOM</h1>
        <div className="flex items-center gap-2">
          <a href={`/seller/${encodeURIComponent(form.seller_name || (typeof window !== "undefined" ? localStorage.getItem("ksm_seller_name") || "" : ""))}`} className="text-[13px] px-4 py-2 rounded-full bg-[#0d9488] text-white font-bold flex items-center gap-1.5 active:scale-95 shadow-sm">
            <span>🏪</span> My Shop
          </a>
          <a href="/" className="text-[13px] px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium">Home</a>
        </div>
      </div>

      {/* STORAGE BAR - Original green design from screenshot - 0% Used - 10/3000 */}
      {!checkingStorage && storageStatus && (
        <div className="max-w-md mx-auto mt-4">
          <div className={`rounded-[20px] p-4 border-2 flex justify-between items-center ${storageStatus.blocked ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : storageStatus.percent > 60 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800" : "bg-[#f0fdf4] border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-800"}`}>
            <div>
              <p className={`text-[15px] font-bold flex items-center gap-1.5 ${storageStatus.blocked ? "text-red-600 dark:text-red-400" : storageStatus.percent > 60 ? "text-yellow-700 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                {storageStatus.blocked ? `🚫 ${storageStatus.percent}% Full - Upload Paused` : `✅ ${storageStatus.percent}% Used - ${storageStatus.count}/${storageStatus.max}`}
              </p>
              <p className="text-[13px] opacity-60 mt-1 dark:text-white/60">
                Next auto-clean: {storageStatus.nextClean}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-full grid place-items-center text-[14px] font-bold shadow-sm ${storageStatus.blocked ? "bg-red-500 text-white" : storageStatus.percent > 60 ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}>
              {storageStatus.percent}%
            </div>
          </div>
        </div>
      )}

      {storageStatus?.blocked ? (
        <div className="max-w-md mx-auto mt-6">
          <div className="rounded-[24px] bg-white dark:bg-zinc-900 border p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 grid place-items-center text-2xl mx-auto">🚫</div>
            <h2 className="text-[16px] font-bold mt-4 dark:text-white">Upload Paused - 80% Full</h2>
            <a href="/" className="mt-5 inline-block w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3 text-[13px] font-bold">Back to Market</a>
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-md mx-auto grid gap-3">
          <div className="rounded-[18px] border border-dashed border-black/20 dark:border-white/10 p-4 bg-white dark:bg-zinc-900 text-center">
            {imageUrl ? <img src={imageUrl} className="w-full h-52 object-cover rounded-[12px] mb-3" /> : <div className="py-10 text-xs opacity-40 dark:text-white/40">No image selected</div>}
            <label className={`inline-block px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${uploading ? "bg-black/20 text-black/40" : "bg-black text-white dark:bg-white dark:text-black"}`}>
              {uploading ? "Uploading..." : imageUrl ? "Change Image" : "📷 Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <p className="text-[10px] opacity-40 mt-2 dark:text-white/40">Auto-compressed to ~150KB</p>
          </div>

          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. iPhone 13 Neat" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price e.g. GH₵ 4200" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white"><option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Furniture</option><option>Books</option><option>Other</option></select>
          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location e.g. Ayeduase" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />

          {/* 🔒 LOCKED INFO - No editable WhatsApp */}
          <div className="p-3 rounded-[18px] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10">
            <p className="text-[11px] font-bold dark:text-white">🔒 Locked from Login</p>
            <div className="mt-2 w-full rounded-full px-4 py-3 border bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center text-sm dark:text-white">
              <span>Shop: <b>{form.seller_name || "Not set"}</b></span><span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">LOCKED</span>
            </div>
            <div className="mt-2 w-full rounded-full px-4 py-3 border bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center text-sm dark:text-white">
              <span>WhatsApp: <b>{form.whatsapp || "Not set"}</b></span><span className="text-[10px] bg-[#0d9488] text-white px-2 py-0.5 rounded-full">LOCKED</span>
            </div>
            {form.whatsapp.length >= 9 && (
              <p className={`text-[10px] mt-2 px-2 ${sellerCount >= MAX_PER_SELLER ? "text-red-500 font-bold" : sellerCount >= MAX_PER_SELLER - 2 ? "text-yellow-600" : "text-green-600"}`}>
                📦 You have {sellerCount}/{MAX_PER_SELLER} products {sellerCount >= MAX_PER_SELLER ? "— MAX REACHED!" : sellerCount >= MAX_PER_SELLER - 2 ? "— Almost full!" : ""} {isVerifiedCollection ? "• Collection: 30 slots ✓" : "• Free: 10 slots"}
              </p>
            )}
            <p className={`text-[10px] mt-2 px-2 ${sellerCount >= MAX_PER_SELLER ? "text-green-500 font-bold" : sellerCount >= MAX_PER_SELLER - 2 ? "text-yellow-600" : "text-green-600"}`}>
              📦 Book a collection at /collections for GH¢ 50 → Get 30 slots! 🚀
            </p>
          </div>

          <button onClick={submit} disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3.5 text-sm font-bold mt-2 active:scale-95">{loading ? "Posting..." : `Post to KSOM (${sellerCount}/${MAX_PER_SELLER})`}</button>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm grid place-items-center p-5">
          <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-[24px] p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500 text-white grid place-items-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="text-[18px] font-bold dark:text-white">Posted to KSOM!</h2>
            <div className="mt-6 grid gap-2">
              <button onClick={handleShareWhatsApp} className="w-full bg-[#25D366] text-white rounded-full py-3.5 text-[13px] font-bold">📲 Share to WhatsApp</button>
              <button onClick={handleDone} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3.5 text-[13px] font-bold">Done → Homepage</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
