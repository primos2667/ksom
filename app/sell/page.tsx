"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = Date.now() + "-" + file.name;
      const { data, error } = await supabase.storage.from("product-images").upload(fileName, file);
      if (error) {
        alert("Bucket not created yet. Go to Supabase > Storage > New Bucket named 'product-images' (public). For now using local preview.");
        const local = URL.createObjectURL(file);
        setImageUrl(local);
      } else {
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(fileName);
        setImageUrl(pub.publicUrl);
      }
    } catch (err: any) { alert(err.message); }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title || !form.price || !form.whatsapp) { alert("Fill title, price, WhatsApp"); return; }
    if (!form.seller_name) { alert("Please enter your Shop/Collection Name - must match your collection name to show on your collection page!"); return; }
    if (!imageUrl) { alert("Please upload image first"); return; }
    setLoading(true);
    const { error } = await supabase.from("products").insert([{ ...form, image_url: imageUrl }]);
    setLoading(false);
    if (error) alert(error.message);
    else {
      alert(`Posted! It will show on homepage and also on your collection page /seller/${form.seller_name}`);
      setForm({ title: "", price: "", category: "Phones", location: "", whatsapp: "", seller_name: "" });
      setImageUrl("");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center"><h1 className="text-xl font-medium">Sell on KSOM</h1><a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white">Home</a></div>

      <div className="mt-6 max-w-md grid gap-3">
        {/* IMAGE UPLOAD */}
        <div className="rounded-[18px] border border-dashed border-black/20 p-4 bg-white text-center">
          {imageUrl ? <img src={imageUrl} className="w-full h-52 object-cover rounded-[12px] mb-3" /> : <div className="py-10 text-xs opacity-40">No image selected</div>}
          <label className={`inline-block px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${uploading ? "bg-black/20 text-black/40" : "bg-black text-white"}`}>
            {uploading ? "Uploading..." : imageUrl ? "Change Image" : "📷 Upload Image from Gallery"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <p className="text-[10px] opacity-40 mt-2">Or paste URL below (optional)</p>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://...jpg (optional if uploaded)" className="mt-2 w-full rounded-full px-4 py-2.5 border border-black/10 text-xs outline-none" />
        </div>

        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title e.g. iPhone 13 Neat" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price e.g. GH₵ 4200" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white">
          <option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Furniture</option><option>Books</option><option>Lab</option>
        </select>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location e.g. Ayeduase" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />
        <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp e.g. 233540000001" className="w-full rounded-full px-4 py-3 border border-black/10 text-sm outline-none bg-white" />

        {/* NEW - SELLER NAME FIELD - THIS LINKS PRODUCT TO COLLECTION */}
        <div className="p-3 rounded-[18px] bg-[#0d9488]/10 border border-[#0d9488]/20">
          <p className="text-[11px] font-bold text-[#0d9488]">🔗 Link to Collection (Important)</p>
          <p className="text-[10px] opacity-60 mt-1">Type your exact Shop/Collection Name. Must match what you booked at /collections. Example: If your collection is "Sneaker Hub", type "Sneaker Hub" here. Product will then show on /seller/Sneaker Hub page.</p>
          <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} placeholder="Shop Name e.g. Sneaker Hub (must match collection name)" className="mt-2 w-full rounded-full px-4 py-3 border border-[#0d9488]/20 text-sm outline-none bg-white" />
        </div>

        <button onClick={submit} disabled={loading} className="w-full bg-black text-white rounded-full py-3.5 text-sm font-bold mt-2">{loading ? "Posting..." : "Post to KSOM"}</button>

        <p className="text-[11px] opacity-50 mt-4">First time? Go to Supabase > Storage > New Bucket > Name: product-images > Make it Public > Save. Then upload will work forever.</p>
        <p className="text-[11px] opacity-50 mt-2">Also run in Supabase SQL: <code>alter table products add column if not exists seller_name text;</code></p>
      </div>
    </div>
  );
}