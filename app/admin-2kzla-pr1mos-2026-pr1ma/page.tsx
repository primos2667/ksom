"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const e = localStorage.getItem("ksm_user") || "";
    setEmail(e);
    // CHANGE THIS to your email to be admin
    if (e.includes("prince") || e.includes("admin") || e.length > 0) setIsAdmin(true); // for now allow anyone who logged in, change later
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const deleteProduct = async (id: string, image_url: string) => {
    if (!confirm("Delete this product? This cannot be undone!")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else {
      // try delete image from storage too
      if (image_url && image_url.includes("product-images")) {
        const path = image_url.split("/product-images/")[1];
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      alert("Deleted!");
      load();
    }
  };

  if (!isAdmin) return <div className="min-h-screen p-5">Please login first at /login - Admin only. Your email: {email}</div>;

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Admin - Delete Bad Products</h1><a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white">Home</a></div>
      <p className="text-xs opacity-60 mt-2">Logged as {email} - You can delete any product here.</p>
      <div className="mt-6 grid gap-3">{products.map((p: any) => <div key={p.id} className="p-3 rounded-[18px] bg-white border border-black/10 flex gap-3">
        <img src={p.image_url} className="w-20 h-20 rounded-[12px] object-cover bg-black/5" />
        <div className="flex-1">
          <p className="text-[13px] font-medium">{p.title}</p><p className="text-[12px] font-bold mt-1">{p.price}</p><p className="text-[10px] opacity-50">{p.location} - {p.whatsapp}</p>
          <div className="flex gap-2 mt-2">
            <a href={`https://wa.me/${String(p.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" className="text-[10px] px-3 py-1 rounded-full bg-[#25D366] text-white">Check WA</a>
            <button onClick={() => deleteProduct(p.id, p.image_url)} className="text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">🗑️ Delete Product</button>
          </div>
        </div>
      </div>)}</div>
    </div>
  );
}