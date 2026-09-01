"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function CartPage() {
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(m.matches ? "dark" : "light");
    loadCart();

    const onUpdate = () => loadCart();
    window.addEventListener('storage', onUpdate);
    window.addEventListener('ksom-cart-update', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('ksom-cart-update', onUpdate);
    };
  }, []);

  const loadCart = () => {
    const ids = JSON.parse(localStorage.getItem("ksm_cart") || "[]");
    setCartIds(ids);
    if (ids.length > 0) {
      const supabase = createClient();
      supabase.from("products").select("*").in("id", ids).then(({ data }) => {
        if (data) setProducts(data);
      });
    } else {
      setProducts([]);
    }
  };

  const removeFromCart = (id: string) => {
    const newCart = cartIds.filter(c => c !== id);
    setCartIds(newCart);
    setProducts(prev => prev.filter(p => p.id !== id));
    localStorage.setItem("ksm_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event('ksom-cart-update'));
    window.dispatchEvent(new Event('storage'));
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen pb-28 ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#fbfaf8] text-black"}`}>
      <div className="px-5 pt-6 flex items-center gap-3">
        <a href="/" className={`w-9 h-9 rounded-full grid place-items-center border ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-black/5 border-black/10"}`}>←</a>
        <h1 className="text-[20px] font-bold">Cart — {cartIds.length}</h1>
      </div>

      <div className="px-5 mt-6 grid gap-3">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-[14px] font-bold">Cart empty</p>
            <p className="text-[12px] opacity-50 mt-1">Add products to see them here</p>
            <a href="/" className="mt-4 inline-block bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full text-[13px] font-bold">Browse KSOM</a>
          </div>
        ) : products.map(p => (
          <div key={p.id} className={`flex gap-3 p-3 rounded-[16px] border ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5"}`}>
            <img src={p.image_url} className="w-[70px] h-[70px] rounded-[12px] object-cover" />
            <div className="flex-1">
              <p className="text-[13px] font-medium truncate">{p.title}</p>
              <p className="text-[13px] font-bold mt-1">{p.price}</p>
              <p className="text-[10px] opacity-50">{p.location}</p>
            </div>
            <button onClick={() => removeFromCart(p.id)} className="w-9 h-9 rounded-full bg-red-500 text-white grid place-items-center active:scale-90">✕</button>
          </div>
        ))}
      </div>

      {cartIds.length > 0 && (
        <div className="px-5 mt-6">
          <button onClick={() => { localStorage.removeItem('ksm_cart'); setCartIds([]); setProducts([]); window.dispatchEvent(new Event('ksom-cart-update')); }} className="w-full bg-red-500 text-white py-3 rounded-full text-[13px] font-bold">Clear Cart</button>
        </div>
      )}
    </div>
  );
}
