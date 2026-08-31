"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SellPage() {
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Phones");
  const [location, setLocation] = useState("Ayeduase");
  const [whatsapp, setWhatsapp] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const seller = localStorage.getItem("ksm_is_seller");
    const id = localStorage.getItem("ksm_seller_id") || "";
    const name = localStorage.getItem("ksm_seller_name") || "";
    if (seller !== "true" || !id.toLowerCase().endsWith("/ksom")) {
      router.push("/login");
    } else {
      setIsSeller(true);
      setSellerId(id);
      setSellerName(name);
    }
  }, [router]);

  const handleSell = async () => {
    if (!title || !price || !whatsapp || !image) {
      setMsg("❌ Fill title, price, whatsapp and image link");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("products").insert([
      {
        title,
        price: `GH₵ ${price}`,
        category,
        location,
        whatsapp,
        image_url: image,
        seller_name: sellerName || sellerId.split("/")[0],
        seller_id_tag: sellerId,
      },
    ]);
    setLoading(false);
    if (error) {
      setMsg("❌ Error: " + error.message);
    } else {
      setMsg("✅ Product posted! It will show in Latest now.");
      setTitle(""); setPrice(""); setImage(""); setWhatsapp("");
      setTimeout(() => router.push("/"), 1200);
    }
  };

  if (!isSeller) return <div className="min-h-screen grid place-items-center bg-[#fbfaf8] text-[12px]">Checking seller tag /ksom...</div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <a href="/" className="text-[11px] px-3 py-1.5 rounded-full bg-black text-white">← Home</a>
          <span className="text-[10px] opacity-60">Seller: {sellerName} • {sellerId}</span>
        </div>

        <h1 className="text-[24px] font-light mt-6">Post new item</h1>
        <p className="text-[11px] opacity-60 mt-1">Only verified /ksom sellers can post. Your item shows in Latest.</p>

        <div className="mt-6 bg-white rounded-[20px] p-5 border border-black/5 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title e.g. iPhone 13 128GB Neat" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none" />
          <div className="flex gap-2">
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price e.g. 4200" className="flex-1 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none">
              <option>Phones</option><option>Fashion</option><option>Electronics</option><option>Shoes</option><option>Grocery</option><option>Books</option><option>Furniture</option><option>Laptop</option>
            </select>
          </div>
          <div className="flex gap-2">
            <select value={location} onChange={e => setLocation(e.target.value)} className="flex-1 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none">
              <option>Ayeduase</option><option>Kotei</option><option>Boadi</option><option>Campus</option><option>Tech</option><option>Other</option>
            </select>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp e.g. 233540000001" className="flex-1 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none" />
          </div>
          <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image link (https://...)" className="w-full px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none" />
          {image && <img src={image} alt="preview" className="w-full h-48 object-cover rounded-[16px] mt-2" />}

          {msg && <p className="text-[11px] p-3 rounded-full bg-black text-white text-center">{msg}</p>}

          <button onClick={handleSell} disabled={loading} className="w-full bg-black text-white py-3.5 rounded-full text-[13px] font-bold mt-2">
            {loading ? "Posting..." : "Post to KSOM →"}
          </button>

          <button onClick={() => { localStorage.removeItem("ksm_is_seller"); localStorage.removeItem("ksm_seller_id"); router.push("/login"); }} className="w-full text-[11px] opacity-50 mt-2">Log out seller</button>
        </div>
      </div>
    </div>
  );
}