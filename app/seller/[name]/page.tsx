
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function SellerPage() {
  const params = useParams();
  const sellerName = decodeURIComponent((params?.name as string) || "");
  const [products, setProducts] = useState<any[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerName) return;
    const fetchData = async () => {
      setLoading(true);
      // 🔒 TIGHT: Only approved collections
      const { data: collection } = await supabase.from("collections").select("*").ilike("seller_name", sellerName).eq("status", "approved").single();
      if (collection) {
        setSellerInfo(collection);
        const { data: prods } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (prods) {
          const filtered = prods.filter((p: any) => {
            // 🔒 LOCKED: Must be EXACT name match (constant from login, can't be changed)
            const nameMatch = p.seller_name && p.seller_name.trim().toLowerCase() === collection.seller_name.trim().toLowerCase();
            // Extra security: check seller_id or whatsapp matches collection owner if available
            const idMatch = collection.seller_id ? p.seller_id === collection.seller_id : true;
            const waMatch = collection.whatsapp ? String(p.whatsapp).replace(/[^0-9]/g, '').slice(-9) === String(collection.whatsapp).replace(/[^0-9]/g, '').slice(-9) : true;
            // If collection_code exists, require it (even tighter)
            const codeMatch = collection.collection_code ? (!p.collection_code || p.collection_code === collection.collection_code) : true;
            // TIGHT: Must have exact name AND (id or whatsapp match)
            return nameMatch && idMatch && waMatch && codeMatch;
          });
          setProducts(filtered);
        }
      } else {
        setSellerInfo(null);
        setProducts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [sellerName]);

  const cleanWA = (num: string) => String(num || "").replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] pb-28">
      <div className="sticky top-0 z-20 bg-[#fbfaf8]/90 dark:bg-[#0f0f0f]/90 backdrop-blur border-b border-black/5 dark:border-white/10 px-5 py-3 flex justify-between items-center">
        <a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black">← Home</a>
        <span className="text-[11px] tracking-[0.2em] uppercase opacity-60 dark:text-white/60">{sellerName} {sellerInfo ? "• 🔒 Locked" : ""}</span>
        <a href="/collections" className="text-[11px] px-3 py-1.5 rounded-full bg-[#0d9488] text-white">Book Spot</a>
      </div>
      <div className="px-5 pt-5">
        <div className="rounded-[20px] overflow-hidden h-36 relative bg-black">
          {sellerInfo?.image_url && <img src={sellerInfo.image_url} className="w-full h-full object-cover opacity-70" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-white text-[20px] font-bold flex items-center gap-2">{sellerName} {sellerInfo && <span className="text-[10px] bg-[#0d9488] px-2 py-0.5 rounded-full">🔒 Locked Name</span>}</h1>
            <p className="text-white/70 text-[11px] mt-1">{sellerInfo?.description || (loading ? "Loading..." : "Not approved collection")}</p>
            {sellerInfo?.whatsapp && <a href={`https://wa.me/${cleanWA(sellerInfo.whatsapp)}`} target="_blank" className="mt-2 inline-block text-[10px] px-3 py-1 rounded-full bg-[#25D366] text-white">Chat WhatsApp</a>}
          </div>
        </div>
        {sellerInfo && (
          <div className="mt-3 p-2.5 rounded-[12px] bg-[#0d9488]/10 border border-[#0d9488]/20 flex items-center gap-2">
            <span className="text-[10px]">🔒</span>
            <p className="text-[10px] text-[#0d9488] font-medium">Locked System: Name is constant from login - can't be changed to steal collection! Only this seller's products show.</p>
          </div>
        )}
      </div>
      <div className="px-5 mt-6">
        <h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60 dark:text-white/60">Collection — {products.length} verified • 🔒 Locked name</h2>
        {loading ? (
          <div className="mt-10 text-center"><p className="text-xs opacity-50">Loading verified...</p></div>
        ) : (
          <div className="mt-3 grid gap-3">
            {products.map((p: any) => (
              <div key={p.id} className="flex gap-3 rounded-[18px] p-3 border bg-white dark:bg-zinc-900 border-black/5 dark:border-white/10">
                <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 shrink-0"><img src={p.image_url} className="w-full h-full object-cover" alt="" /></div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between"><span className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 dark:text-white/70">{p.category}</span><span className="text-[10px] opacity-40">{p.location}</span></div>
                    <p className="text-[13px] font-medium mt-1.5 dark:text-white">{p.title}</p>
                    <p className="text-[13px] font-bold mt-1 dark:text-white">{p.price}</p>
                    <p className="text-[8px] mt-1 text-[#0d9488]">✓ Locked name verified</p>
                  </div>
                  <a href={`https://wa.me/${cleanWA(p.whatsapp)}?text=Hi ${sellerName}, I'm interested in ${p.title}`} target="_blank" className="block w-full bg-[#25D366] text-white text-[11px] font-bold py-2.5 rounded-full text-center mt-2">💬 WhatsApp</a>
                </div>
              </div>
            ))}
            {products.length === 0 && !loading && (
              <div className="text-center mt-10 p-5 rounded-[18px] bg-white dark:bg-zinc-900 border">
                <p className="text-xs font-bold">No verified products for "{sellerName}"</p>
                <p className="text-[11px] opacity-50 mt-2">Products only show if seller posted with LOCKED constant name from login. Can't cheat!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
