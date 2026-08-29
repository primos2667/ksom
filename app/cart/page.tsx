"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const ids: string[] = JSON.parse(localStorage.getItem("ksm_cart") || "[]");
      if (ids.length === 0) { setItems([]); return; }
      const cache = JSON.parse(localStorage.getItem("ksm_products_cache") || "[]");
      let found = cache.filter((p: any) => ids.includes(p.id));
      if (found.length !== ids.length) {
        const { data } = await supabase.from("products").select("*").in("id", ids);
        if (data) found = data;
      }
      setItems(found);
    };
    load();
  }, []);
  const remove = (id: string) => {
    const n = items.filter((i: any) => i.id !== id);
    setItems(n);
    localStorage.setItem("ksm_cart", JSON.stringify(n.map((i: any) => i.id)));
  };
  const clearAll = () => {
    localStorage.removeItem("ksm_cart");
    setItems([]);
  };
  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">Cart — {items.length}</h1>
        <div className="flex gap-2"><button onClick={clearAll} className="text-[11px] px-3 py-1.5 rounded-full bg-red-50 text-red-500">Clear All</button><a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white">Home</a></div>
      </div>
      {items.length === 0 ? <p className="mt-10 text-sm opacity-50">No items in cart. Tap 🛒 on real products on homepage.</p> :
        <div className="mt-6 grid gap-3">{items.map((p: any) => <div key={p.id} className="p-3 rounded-[18px] bg-white border border-black/10 flex gap-3">
          {p.image_url ? <img src={p.image_url} className="w-20 h-20 rounded-[12px] object-cover bg-black/5" /> : <div className="w-20 h-20 rounded-[12px] bg-black/5 grid place-items-center text-xs">No Img</div>}
          <div className="flex-1"><p className="text-[13px] font-medium leading-tight">{p.title}</p><p className="text-[13px] font-bold mt-1">{p.price}</p><button onClick={() => remove(p.id)} className="text-[11px] mt-2 text-red-500">Remove</button></div>
        </div>)}</div>
      }
    </div>
  );
}