"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";

export default function SellPage() {
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });

  useEffect(() => {
    const seller = localStorage.getItem("ksm_is_seller");
    const id = localStorage.getItem("ksm_seller_id") || "";
    if (seller !== "true" || !id.toLowerCase().endsWith("/ksom")) {
      router.push("/login");
    } else {
      setIsSeller(true);
    }
  }, [router]);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 800, 0.7);
      const fileName = Date.now() + "-" + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const { data, error } = await supabase.storage.from("product-images").upload(fileName, compressedFile);
      if (error) {
        alert("Bucket not created yet. Go to Supabase > Storage > New Bucket 'product-images' (public). Showing preview.");
        const local = URL.createObjectURL(compressedFile);
        setImageUrl(local);
      } else {
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setImageUrl(pub.publicUrl);
        alert(`Compressed & uploaded! Saved ${(file.size / 1024 / 1024 - compressedFile.size / 1024 / 1024).toFixed(2)}MB!`);
      }
    } catch (err: any) { alert(err.message); }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title || !form.price || !form.whatsapp) { alert("Fill title, price, WhatsApp"); return; }
    if (!form.seller_name) { alert("Enter Shop Name - must match collection name!"); return; }
    if (!imageUrl) { alert("Please upload image first"); return; }
    setLoading(true);
    const { error } = await supabase.from("products").insert([{ ...form, image_url: imageUrl }]);
    setLoading(false);
    if (error) alert(error.message);
    else {
      // WHATSAPP NOTIFY - Auto share to community
      const waMessage = `🚀 NEW ON KSOM!\n\n📦 ${form.title}\n💰 ${form.price}\n📍 ${form.location}\n🏪 ${form.seller_name}\n\nCheck: https://ksom.vercel.app\n\nJoin: https://chat.whatsapp.com/JDF0gdFMiQQKz9GslNGWav`;

      const share = confirm(`Posted! 🎉\n\nIt will notify all users on KSOM bell 🔔\n\nWant to share to WhatsApp Community too?`);
      if (share) {
        window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, "_blank");
      }

      setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });
      setImageUrl("");
      window.location.href = "/";
    }
  };

  if (!isSeller) return <div className="min-h-screen grid place-items-center bg-[#fbfaf8] text-[12px]">Checking verification...</div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center"><h1 className="text-xl font-medium">Sell on KSOM</h1><a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white">Home</a></div>

      <div className="mt-6 max-w-md grid gap-3">
        <div className="rounded-[18px] border border-dashed border-black/20 p-4 bg-white text-center">
          {imageUrl ? <img src={imageUrl} className="w-full h-52 object-cover rounded-[12px] mb-3" /> : <div className="py-10 text-xs opacity-40">No image selected<br /><span className="text-[10px]">Auto-compressed to 200KB</span></div>}
          <label className={`inline-block px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${uploading ? "bg-black/20 text-black/40" : "bg-black text-white"}`}>
            {uploading ? "Compressing..." : imageUrl ? "Change Image" : "📷 Upload Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <p className="text-[10px] opacity-40 mt-2">Auto-compressed + Will notify 🔔 all users!</p>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://...jpg (optional)" className="mt-2 w-full rounded-full px-4 py-2.5 border border-black/10 text-xs outline-none" />
        </div>

        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. iPhone 13 Neat" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price e.g. GH₵ 4200" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white">
          <option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Furniture</option><option>Books</option><option>Other</option>
        </select>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location e.g. Ayeduase" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp e.g. 233540000001" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />

        <div className="p-3 rounded-[18px] bg-[#0d9488]/10 border border-[#0d9488]/20">
          <p className="text-[11px] font-bold text-[#0d9488]">🔗 Link to Collection</p>
          <p className="text-[10px] opacity-60 mt-1">Exact Shop Name. Must match collection.</p>
          <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} placeholder="Shop Name e.g. Sneaker Hub" className="mt-2 w-full rounded-full px-4 py-3 border border-[#0d9488]/20 text-sm outline-none bg-white" />
        </div>

        <button onClick={submit} disabled={loading} className="w-full bg-black text-white rounded-full py-3.5 text-sm font-bold mt-2">{loading ? "Posting..." : "Post to KSOM + Notify 🔔"}</button>
      </div>
    </div>
  );
}
