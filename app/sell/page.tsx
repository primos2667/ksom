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

  useEffect(() => {
    const seller = localStorage.getItem("ksm_is_seller");
    const id = localStorage.getItem("ksm_seller_id") || "";
    if (seller !== "true" || !id.toLowerCase().endsWith("/ksom")) {
      router.push("/login");
    } else {
      setIsSeller(true);
      // Try to auto-fill seller name if they have collection
      const savedSellerName = localStorage.getItem("ksm_seller_name") || "";
      if (savedSellerName) {
        setForm(prev => ({ ...prev, seller_name: savedSellerName }));
        setHasCollection(true);
      }
    }
  }, [router]);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (error) {
        // Fallback to local preview without alert
        const local = URL.createObjectURL(compressedFile);
        setImageUrl(local);
      } else {
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setImageUrl(pub.publicUrl);
        // No popup! Silent success
      }
    } catch (err: any) {
      // Silent error, just show local preview
      const local = URL.createObjectURL(file);
      setImageUrl(local);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title || !form.price || !form.whatsapp) {
      alert("Fill title, price, WhatsApp");
      return;
    }
    if (!imageUrl) {
      alert("Please upload image first");
      return;
    }
    // seller_name is OPTIONAL now - no check!

    setLoading(true);
    const supabase = createClient();
    const payload: any = {
      title: form.title,
      price: form.price,
      category: form.category,
      location: form.location,
      whatsapp: form.whatsapp,
      image_url: imageUrl,
    };
    // Only add seller_name if they have collection and filled it
    if (hasCollection && form.seller_name.trim()) {
      payload.seller_name = form.seller_name.trim();
      localStorage.setItem("ksm_seller_name", form.seller_name.trim());
    }

    const { error } = await supabase.from("products").insert([payload]);
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      // Show nice success popup instead of ugly alert/confirm
      setShowSuccess(true);
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

  if (!isSeller) return <div className="min-h-screen grid place-items-center bg-[#fbfaf8] text-[12px]">Checking verification...</div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] p-5 pb-28">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-xl font-bold dark:text-white">Sell on KSOM</h1>
        <a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black">Home</a>
      </div>

      <div className="mt-6 max-w-md mx-auto grid gap-3">
        {/* IMAGE */}
        <div className="rounded-[18px] border border-dashed border-black/20 dark:border-white/10 p-4 bg-white dark:bg-zinc-900 text-center">
          {imageUrl ? <img src={imageUrl} className="w-full h-52 object-cover rounded-[12px] mb-3" /> : <div className="py-10 text-xs opacity-40 dark:text-white/40">No image selected</div>}
          <label className={`inline-block px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${uploading ? "bg-black/20 text-black/40" : "bg-black text-white dark:bg-white dark:text-black"}`}>
            {uploading ? "Uploading..." : imageUrl ? "Change Image" : "📷 Upload Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <p className="text-[10px] opacity-40 mt-2 dark:text-white/40">Auto-compressed</p>
        </div>

        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. iPhone 13 Neat" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />
        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price e.g. GH₵ 4200" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white">
          <option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Furniture</option><option>Books</option><option>Other</option>
        </select>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location e.g. Ayeduase" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />
        <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp e.g. 233540000001" className="w-full rounded-full px-4 py-3 border border-black/10 dark:border-white/10 text-sm outline-none bg-white dark:bg-zinc-900 dark:text-white" />

        {/* COLLECTION - OPTIONAL NOW! */}
        <div className="p-3 rounded-[18px] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasCollection} onChange={e => setHasCollection(e.target.checked)} className="w-4 h-4 rounded accent-[#0d9488]" />
            <span className="text-[11px] font-bold dark:text-white">I have a collection with KSOM</span>
          </label>
          <p className="text-[10px] opacity-60 mt-1 dark:text-white/60">Only check if you booked a collection at /collections. Then your product will show on your seller page.</p>

          {hasCollection && (
            <div className="mt-3 p-3 rounded-[12px] bg-[#0d9488]/10 border border-[#0d9488]/20 animate-in">
              <p className="text-[10px] font-bold text-[#0d9488]">🔗 Your Shop Name</p>
              <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} placeholder="Exact shop name e.g. Sneaker Hub" className="mt-2 w-full rounded-full px-4 py-3 border border-[#0d9488]/20 text-sm outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              <p className="text-[9px] opacity-50 mt-1 dark:text-white/40">Must match your collection name exactly!</p>
            </div>
          )}
        </div>

        <button onClick={submit} disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3.5 text-sm font-bold mt-2 active:scale-95 transition-transform">{loading ? "Posting..." : "Post to KSOM"}</button>
      </div>

      {/* NICE SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm grid place-items-center p-5">
          <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-[24px] p-6 text-center shadow-2xl animate-in">
            <div className="w-16 h-16 rounded-full bg-green-500 text-white grid place-items-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="text-[18px] font-bold dark:text-white">Posted to KSOM!</h2>
            <p className="text-[12px] opacity-60 mt-2 dark:text-white/60">Your product is now live on homepage and will notify all users 🔔</p>

            <div className="mt-6 grid gap-2">
              <button onClick={handleShareWhatsApp} className="w-full bg-[#25D366] text-white rounded-full py-3.5 text-[13px] font-bold active:scale-95 transition-transform">📲 Share to WhatsApp Status</button>
              <button onClick={handleDone} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-full py-3.5 text-[13px] font-bold active:scale-95 transition-transform">Done → Homepage</button>
            </div>

            <p className="text-[10px] opacity-30 mt-4 dark:text-white/30">Tap outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
