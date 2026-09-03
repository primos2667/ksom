"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/compressImage";

export default function SellPage() {
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasCollection, setHasCollection] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });

  // 🔒 Storage Guard States
  const [storageStatus, setStorageStatus] = useState<{ blocked: boolean; count: number; max: number; percent: number; nextClean: string; daysToClean: number } | null>(null);
  const [checkingStorage, setCheckingStorage] = useState(true);
  const [sellerCount, setSellerCount] = useState<number>(0);
  const MAX_PER_SELLER = 30;

  useEffect(() => {
    const seller = localStorage.getItem("ksm_is_seller");
    const id = localStorage.getItem("ksm_seller_id") || "";
    if (seller !== "true" || !id.toLowerCase().endsWith("/ksom")) {
      router.push("/login");
    } else {
      setIsSeller(true);
      const savedSellerName = localStorage.getItem("ksm_seller_name") || "";
      if (savedSellerName) {
        setForm(prev => ({ ...prev, seller_name: savedSellerName }));
        setHasCollection(true);
      }
      checkStorageLimit();
    }
  }, [router]);

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
      const cleanDates = [
        new Date(currentYear, 0, 1),
        new Date(currentYear, 3, 1),
        new Date(currentYear, 6, 1),
        new Date(currentYear, 9, 1),
      ];
      let nextClean = cleanDates.find(d => d > now);
      if (!nextClean) {
        nextClean = new Date(currentYear + 1, 0, 1);
      }
      const daysToClean = Math.ceil((nextClean.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setStorageStatus({
        blocked,
        count: productCount,
        max: MAX_PRODUCTS,
        percent,
        nextClean: nextClean.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" }),
        daysToClean
      });
    } catch (e) {
      console.error(e);
    }
    setCheckingStorage(false);
  };

  const handleImageUpload = async (e: any) => {
    if (storageStatus?.blocked) {
      alert(`🚫 Storage 80% full! Next clean on ${storageStatus.nextClean}`);
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (error) {
        const local = URL.createObjectURL(compressedFile);
        setImageUrl(local);
      } else {
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setImageUrl(pub.publicUrl);
      }
    } catch (err: any) {
      const local = URL.createObjectURL(file);
      setImageUrl(local);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (storageStatus?.blocked) {
      alert(`🚫 KSOM Storage is ${storageStatus.percent}% full! We stop at 80% to keep app fast.\n\n🧹 Next auto-clean: ${storageStatus.nextClean} (in ${storageStatus.daysToClean} days)\n\nOld products >90 days will be removed automatically.`);
      return;
    }
    if (!form.title || !form.price || !form.whatsapp) {
      alert("Fill title, price, WhatsApp");
      return;
    }
    if (!imageUrl) {
      alert("Please upload image first");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
    if ((count || 0) >= Math.floor(3000 * 0.8)) {
      setLoading(false);
      alert(`🚫 Just reached 80% limit! Please wait for next clean on ${storageStatus?.nextClean}`);
      checkStorageLimit();
      return;
    }
    const myCount = await checkSellerCount(form.whatsapp);
    if (myCount >= MAX_PER_SELLER) {
      setLoading(false);
      alert(`🚫 You have reached max ${MAX_PER_SELLER} products!\n\nYou currently have ${myCount} items on KSOM.\n\nPlease delete sold items or wait for 3-month auto-clean to add more. This prevents one seller dominating homepage.`);
      return;
    }

    const payload: any = {
      title: form.title,
      price: form.price,
      category: form.category,
      location: form.location,
      whatsapp: form.whatsapp,
      image_url: imageUrl,
    };
    if (hasCollection && form.seller_name.trim()) {
      payload.seller_name = form.seller_name.trim();
      localStorage.setItem("ksm_seller_name", form.seller_name.trim());
    }

    const { error } = await supabase.from("products").insert([payload]);
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setShowSuccess(true);
      checkStorageLimit();
    }
  };

  const handleShareWhatsApp = () => {
    const waMessage = `🚀 NEW ON KSOM!\n\n📦 ${form.title}\n💰 ${form.price}\n📍 ${form.location}\n${form.seller_name ? `🏪 ${form.seller_name}\n` : ""}\nCheck: https://ksom.vercel.app\n\nJoin: https://chat.whatsapp.com/JDF0gdFMiQQKz9GslNGWav`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, "_blank");
    setShowSuccess(false);
    setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: form.seller_name });
    setImageUrl("");
    router.push("/");
  };

  const handleDone = () => {
    setShowSuccess(false);
    setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: form.seller_name });
    setImageUrl("");
    router.push("/");
  };

  // ✅ FIXED: No white flash! Smooth dark-aware skeleton same as homepage
  if (!isSeller) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28">
        <div className="max-w-md mx-auto animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded-full"></div>
            <div className="h-6 w-16 bg-black/10 dark:bg-white/10 rounded-full"></div>
          </div>
          <div className="mt-4 h-12 w-full bg-black/5 dark:bg-white/5 rounded-[16px]"></div>
          <div className="mt-6 grid gap-3">
            <div className="h-52 bg-black/5 dark:bg-white/5 rounded-[18px]"></div>
            <div className="h-12 bg-black/5 dark:bg-white/5 rounded-full"></div>
            <div className="h-12 bg-black/5 dark:bg-white/5 rounded-full"></div>
            <div className="h-12 bg-black/5 dark:bg-white/5 rounded-full"></div>
            <div className="h-12 bg-black/5 dark:bg-white/5 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28 transition-colors duration-200">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-xl font-bold dark:text-white">Sell on KSOM</h1>
        <a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
      </div>

      {/* 🔒 STORAGE STATUS BAR */}
      {!checkingStorage && storageStatus && (
        <div className="max-w-md mx-auto mt-4">
          <div className={`rounded-[16px] p-3 border flex justify-between items-center ${storageStatus.blocked ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : storageStatus.percent > 60 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800" : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"}`}>
            <div>
              <p className={`text-[11px] font-bold ${storageStatus.blocked ? "text-red-600 dark:text-red-400" : storageStatus.percent > 60 ? "text-yellow-700 dark:text-yellow-400" : "text-green-700 dark:text-green-400"}`}>
                {storageStatus.blocked ? `🚫 ${storageStatus.percent}% Full - Upload Paused` : `✅ ${storageStatus.percent}% Used - ${storageStatus.count}/${storageStatus.max}`}
              </p>
              <p className="text-[10px] opacity-60 mt-0.5 dark:text-white/60">
                {storageStatus.blocked ? `Next clean: ${storageStatus.nextClean} (${storageStatus.daysToClean}d)` : `Next auto-clean: ${storageStatus.nextClean}`}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full grid place-items-center text-[10px] font-bold ${storageStatus.blocked ? "bg-red-500 text-white" : storageStatus.percent > 60 ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}>
              {storageStatus.percent}%
            </div>
          </div>
        </div>
      )}

      {storageStatus?.blocked ? (
        <div className="max-w-md mx-auto mt-6">
          <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 grid place-items-center text-2xl mx-auto">🚫</div>
            <h2 className="text-[16px] font-bold mt-4 dark:text-white">Upload Paused - 80% Full</h2>
            <p className="text-[12px] opacity-60 mt-2 dark:text-white/60">
              KSOM is free, so we limit to <b>{storageStatus.max} products</b> to keep it fast for everyone.<br />
              We reached <b>{storageStatus.count} products ({storageStatus.percent}%)</b>.
            </p>
            <div className="mt-4 p-3 rounded-[12px] bg-[#fbfaf8] dark:bg-zinc-800 text-left">
              <p className="text-[11px] font-bold dark:text-white">🧹 Next Auto-Clean:</p>
              <p className="text-[13px] font-bold text-[#0d9488] mt-1">{storageStatus.nextClean}</p>
              <p className="text-[10px] opacity-60 mt-1 dark:text-white/60">In {storageStatus.daysToClean} days, products older than 90 days will be auto-deleted to make space. Your new products can be posted after that!</p>
            </div>
            <p className="text-[10px] opacity-40 mt-4 dark:text-white/40">Tip: Delete your old sold items in /admin to free space faster!</p>
            <a href="/" className="mt-5 inline-block w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3 text-[13px] font-bold">Back to Market</a>
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-md mx-auto grid gap-3">
          <div className="rounded-[18px] border border-dashed border-black/20 dark:border-white/10 p-4 bg-white dark:bg-zinc-900 text-center transition-colors">
            {imageUrl ? <img src={imageUrl} className="w-full h-52 object-cover rounded-[12px] mb-3" /> : <div className="py-10 text-xs opacity-40 dark:text-white/40">No image selected</div>}
            <label className={`inline-block px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${uploading ? "bg-black/20 text-black/40" : "bg-black text-white dark:bg-white dark:text-black"}`}>
              {uploading ? "Uploading..." : imageUrl ? "Change Image" : "📷 Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <p className="text-[10px] opacity-40 mt-2 dark:text-white/40">Auto-compressed to ~150KB</p>
          </div>

          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. iPhone 13 Neat" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white transition-colors" />
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price e.g. GH₵ 4200" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white transition-colors" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white transition-colors">
            <option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Furniture</option><option>Books</option><option>Other</option>
          </select>
          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location e.g. Ayeduase" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white transition-colors" />
          <div>
            <input value={form.whatsapp} onChange={e => { setForm({ ...form, whatsapp: e.target.value }); if (e.target.value.length >= 9) checkSellerCount(e.target.value); }} onBlur={e => checkSellerCount(e.target.value)} placeholder="WhatsApp e.g. 233540000001" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white transition-colors" />
            {form.whatsapp.length >= 9 && (
              <p className={`text-[10px] mt-1.5 px-2 ${sellerCount >= 30 ? "text-red-500 font-bold" : sellerCount >= 20 ? "text-yellow-600" : "text-green-600"}`}>
                📦 You have {sellerCount}/{MAX_PER_SELLER} products {sellerCount >= 30 ? "— MAX REACHED!" : sellerCount >= 25 ? "— Almost full!" : ""}
              </p>
            )}
          </div>

          <div className="p-3 rounded-[18px] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 transition-colors">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasCollection} onChange={e => setHasCollection(e.target.checked)} className="w-4 h-4 rounded accent-[#0d9488]" />
              <span className="text-[11px] font-bold dark:text-white">I have a collection with KSOM</span>
            </label>
            <p className="text-[10px] opacity-60 mt-1 dark:text-white/60">Only check if you booked a collection at /collections.</p>
            {hasCollection && (
              <div className="mt-3 p-3 rounded-[12px] bg-[#0d9488]/10 border border-[#0d9488]/20">
                <p className="text-[10px] font-bold text-[#0d9488]">🔗 Your Shop Name</p>
                <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} placeholder="Exact shop name e.g. Sneaker Hub" className="mt-2 w-full rounded-full px-4 py-3 border border-[#0d9488]/20 text-sm outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              </div>
            )}
          </div>

          <button onClick={submit} disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3.5 text-sm font-bold mt-2 active:scale-95 transition-transform">{loading ? "Posting..." : "Post to KSOM"}</button>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm grid place-items-center p-5">
          <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-[24px] p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500 text-white grid place-items-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="text-[18px] font-bold dark:text-white">Posted to KSOM!</h2>
            <p className="text-[12px] opacity-60 mt-2 dark:text-white/60">Live now - will notify users 🔔</p>
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
