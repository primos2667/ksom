"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function SellerPage() {
  const params = useParams();
  const sellerName = decodeURIComponent((params?.name as string) || "");
  const [products, setProducts] = useState<any[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  useEffect(() => {
    if (!sellerName) return;
    supabase.from("collections").select("*").ilike("seller_name", sellerName).single().then(({ data }) => { if (data) setSellerInfo(data); });
    supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        // STRICT: only exact seller_name match (case-insensitive trim)
        const filtered = data.filter((p: any) =>
          p.seller_name && p.seller_name.trim().toLowerCase() === sellerName.trim().toLowerCase()
        );
        setProducts(filtered);
      }
    });
  }, [sellerName]);

  const cleanWA = (num: string) => String(num || "").replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#fbfaf8] pb-28">
      <div className="sticky top-0 z-20 bg-[#fbfaf8]/90 backdrop-blur border-b border-black/5 px-5 py-3 flex justify-between items-center">
        <a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white">← Home</a>
        <span className="text-[11px] tracking-[0.2em] uppercase opacity-60">{sellerName}</span>
        <a href="/collections" className="text-[11px] px-3 py-1.5 rounded-full bg-[#0d9488] text-white">Book Spot</a>
      </div>

      <div className="px-5 pt-5">
        <div className="rounded-[20px] overflow-hidden h-36 relative bg-black">
          {sellerInfo?.image_url && <img src={sellerInfo.image_url} className="w-full h-full object-cover opacity-70" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-white text-[20px] font-bold leading-tight">{sellerName}</h1>
            <p className="text-white/70 text-[11px] mt-1">{sellerInfo?.description || "Verified seller on KSOM"}</p>
            {sellerInfo?.whatsapp && <a href={`https://wa.me/${cleanWA(sellerInfo.whatsapp)}`} target="_blank" className="mt-2 inline-block text-[10px] px-3 py-1 rounded-full bg-[#25D366] text-white">Chat on WhatsApp</a>}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60">Collection — {products.length} items • Strict match only • No cart/fav</h2>
        <div className="mt-3 grid gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="flex gap-3 rounded-[18px] p-3 border bg-white border-black/5">
              <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 shrink-0"><img src={p.image_url} className="w-full h-full object-cover" alt="" /></div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between"><span className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 border border-black/10">{p.category}</span><span className="text-[10px] opacity-40">{p.location}</span></div>
                  <p className="text-[13px] font-medium mt-1.5 leading-tight">{p.title}</p>
                  <p className="text-[13px] font-bold mt-1">{p.price}</p>
                </div>
                <div className="mt-2">
                  <a href={`https://wa.me/${cleanWA(p.whatsapp)}?text=Hi ${sellerName}, I'm interested in ${p.title} on KSOM`} target="_blank" className="block w-full bg-[#25D366] text-white text-[11px] font-bold py-2.5 rounded-full text-center">💬 WhatsApp Seller</a>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center mt-10 p-5 rounded-[18px] bg-white border">
              <p className="text-xs font-bold">No products yet for "{sellerName}"</p>
              <p className="text-[11px] opacity-50 mt-2">Products only show here if seller typed EXACT shop name "{sellerName}" in Sell page → Link to Collection field.</p>
              <p className="text-[11px] opacity-50 mt-1">Anything else typed will NOT show here now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}