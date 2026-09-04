"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function SellerPage() {
  const params = useParams();
  const sellerName = decodeURIComponent((params?.name as string) || "");
  const [products, setProducts] = useState<any[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sellerName) return;

    // Check if viewer is owner
    const myName = (typeof window !== "undefined" ? localStorage.getItem("ksm_seller_name") || "" : "");
    if (myName && myName.toLowerCase() === sellerName.toLowerCase()) {
      setIsOwner(true);
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();
        // Fetch seller collection info - use maybeSingle to avoid error if not found
        const { data: collData } = await supabase.from("collections").select("*").eq("seller_name", sellerName).maybeSingle();
        if (collData) setSellerInfo(collData);

        // Fetch only this seller's products
        const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (data) {
          const filtered = data.filter((p: any) =>
            (p.seller_name && p.seller_name.toLowerCase() === sellerName.toLowerCase()) ||
            (p.seller_name && p.seller_name.toLowerCase().includes(sellerName.toLowerCase()))
          );
          // Also try by whatsapp if we have collection whatsapp
          let finalProducts = filtered;
          if (filtered.length === 0 && collData?.whatsapp) {
            const byWa = data.filter((p: any) => {
              const clean = (w: string) => String(w || "").replace(/[^0-9]/g, '').slice(-9);
              return clean(p.whatsapp) === clean(collData.whatsapp);
            });
            finalProducts = byWa;
          }
          // If still none, if owner, show all his products by his own whatsapp
          if (finalProducts.length === 0) {
            const myWa = (typeof window !== "undefined" ? localStorage.getItem("ksm_seller_whatsapp") || localStorage.getItem("ksm_whatsapp") || "" : "");
            if (myWa && isOwner) {
              const clean = (w: string) => String(w || "").replace(/[^0-9]/g, '').slice(-9);
              const myFiltered = data.filter((p: any) => clean(p.whatsapp) === clean(myWa));
              finalProducts = myFiltered;
            }
          }
          setProducts(finalProducts);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [sellerName]);

  const cleanWA = (num: string) => String(num || "").replace(/[^0-9]/g, '');

  const deleteProduct = async (id: string, image_url: string) => {
    if (!confirm("🗑️ Delete this product? Sold out? This cannot be undone!")) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      if (image_url?.includes("product-images")) {
        const path = image_url.split("/product-images/")[1]?.split("?")[0];
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      alert("✅ Deleted! Product removed from your shop.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f0f] pb-28 transition-colors">
      <div className="sticky top-0 z-20 bg-[#fbfaf8]/90 dark:bg-[#0f0f0f]/90 backdrop-blur border-b border-black/5 dark:border-white/10 px-5 py-3 flex justify-between items-center">
        <a href="/" className="text-xs px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black">← Home</a>
        <span className="text-[11px] tracking-[0.2em] uppercase opacity-60 dark:text-white flex items-center gap-1.5">
          {isOwner && <span className="bg-[#0d9488] text-white px-2 py-0.5 rounded-full text-[9px]">👑 YOUR SHOP</span>}
          {sellerName}
        </span>
        <a href="/collections" className="text-[11px] px-3 py-1.5 rounded-full bg-[#0d9488] text-white">Book Spot</a>
      </div>

      <div className="px-5 pt-5">
        <div className="rounded-[20px] overflow-hidden h-36 relative bg-black">
          {sellerInfo?.image_url && <img src={sellerInfo.image_url} className="w-full h-full object-cover opacity-70" alt="" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-white text-[20px] font-bold leading-tight flex items-center gap-2">
              {sellerName} {isOwner && <span className="text-[10px] bg-[#0d9488] px-2 py-0.5 rounded-full">👑 Owner</span>}
            </h1>
            <p className="text-white/70 text-[11px] mt-1">{sellerInfo?.description || "Verified seller on KSOM"}</p>
            <div className="flex gap-2 mt-2">
              {sellerInfo?.whatsapp && <a href={`https://wa.me/${cleanWA(sellerInfo.whatsapp)}`} target="_blank" className="text-[10px] px-3 py-1 rounded-full bg-[#25D366] text-white">Chat on WhatsApp</a>}
              {isOwner && <a href="/sell" className="text-[10px] px-3 py-1 rounded-full bg-white text-black font-bold">+ Add Product</a>}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="mt-3 p-3 rounded-[16px] bg-[#0d9488]/10 border border-[#0d9488]/20">
            <p className="text-[11px] font-bold text-[#0d9488]">👑 This is YOUR shop! You can delete sold out items below.</p>
            <p className="text-[10px] opacity-60 mt-1 dark:text-white/60">Only you see delete buttons. Others see WhatsApp button only. Tight security!</p>
          </div>
        )}
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-[11px] tracking-[0.2em] uppercase opacity-60 dark:text-white/60">
          Collection — {products.length} items {isOwner ? "• You can delete sold out" : "• No cart/fav here"}
        </h2>
        <div className="mt-3 grid gap-3">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-black/5 dark:bg-white/5 rounded-[18px] animate-pulse"></div>
              <div className="h-24 bg-black/5 dark:bg-white/5 rounded-[18px] animate-pulse"></div>
            </div>
          ) : products.map((p: any) => (
            <div key={p.id} className="flex gap-3 rounded-[18px] p-3 border bg-white dark:bg-zinc-900 border-black/5 dark:border-white/10">
              <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-black/10 dark:bg-white/10 shrink-0"><img src={p.image_url} className="w-full h-full object-cover" alt="" /></div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between"><span className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 dark:text-white">{p.category}</span><span className="text-[10px] opacity-40 dark:text-white/40">{p.location}</span></div>
                  <p className="text-[13px] font-medium mt-1.5 leading-tight dark:text-white">{p.title}</p>
                  <p className="text-[13px] font-bold mt-1 dark:text-white">{p.price}</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <a href={`https://wa.me/${cleanWA(p.whatsapp)}?text=Hi ${sellerName}, I'm interested in ${p.title} on KSOM`} target="_blank" className="flex-1 bg-[#25D366] text-white text-[11px] font-bold py-2.5 rounded-full text-center">💬 WhatsApp</a>
                  {isOwner && (
                    <button onClick={() => deleteProduct(p.id, p.image_url)} className="px-3 py-2.5 rounded-full bg-red-500 text-white text-[11px] font-bold active:scale-95">🗑️</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!loading && products.length === 0 && <p className="text-xs opacity-40 text-center mt-10 dark:text-white/40">No products yet for this seller. Seller should post items with same seller name.<br />{isOwner && "Go to /sell to add your first product!"}</p>}
        </div>
      </div>
    </div>
  );
}