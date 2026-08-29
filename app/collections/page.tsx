"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CollectionsPage() {
  const [form, setForm] = useState({ seller_name: "", description: "", whatsapp: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_EMAIL = "primos7662@gmail.com"; // change to your email

  useEffect(() => {
    const e = (localStorage.getItem("ksm_user") || "").toLowerCase().trim();
    setIsAdmin(e === ADMIN_EMAIL.toLowerCase());
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
    if (data) setList(data);
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileName = "collection-" + Date.now() + "-" + file.name;
    await supabase.storage.from("product-images").upload(fileName, file);
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const submit = async () => {
    if (!form.seller_name || !form.description) { alert("Fill name & description"); return; }
    await supabase.from("collections").insert([{ ...form, status: "pending" }]);
    alert("Collection request sent! Admin will approve and it will show on homepage after advert board.");
    setForm({ seller_name: "", description: "", whatsapp: "", image_url: "" });
    load();
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Book Collection Spot 📦</h1><a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white">Home</a></div>
      <div className="mt-4 p-4 rounded-[18px] bg-[#0d9488] text-white">
        <p className="text-sm font-bold">6 Featured Spots After Ad Board</p>
        <p className="text-xs opacity-80 mt-1">Sellers pay to have their collection block on homepage. Buyer taps seller name → sees only their items (no cart/fav). GH₵ 30/week</p>
      </div>

      <h2 className="text-sm font-bold mt-6">Request Collection Feature</h2>
      <div className="mt-3 grid gap-3 max-w-md">
        <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} placeholder="Seller / Shop Name" className="w-full rounded-full px-4 py-3 border border-black/10 bg-white text-sm outline-none" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What do you sell? e.g. Original sneakers & slides" className="w-full rounded-[18px] px-4 py-3 border border-black/10 bg-white text-sm outline-none h-20" />
        <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp 2335..." className="w-full rounded-full px-4 py-3 border border-black/10 bg-white text-sm outline-none" />
        <div className="rounded-[18px] border border-dashed border-black/20 p-4 bg-white text-center">
          {form.image_url ? <img src={form.image_url} className="w-full h-40 object-cover rounded-[12px] mb-2" /> : <p className="text-xs opacity-40 py-6">Collection cover image</p>}
          <label className="inline-block px-4 py-2 rounded-full bg-black text-white text-xs cursor-pointer">{uploading ? "Uploading..." : "Upload Image"}<input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>
        </div>
        <button onClick={submit} className="w-full bg-black text-white rounded-full py-3 text-sm font-bold">Submit Request</button>
      </div>

      {isAdmin && (
        <div className="mt-10 p-4 rounded-[18px] bg-yellow-50 border border-yellow-200">
          <h2 className="text-sm font-bold">🔒 Admin - Collection Requests</h2>
          <div className="mt-3 grid gap-3">
            {list.map((c: any) => <div key={c.id} className="p-3 rounded-[18px] bg-white border flex gap-3">
              <img src={c.image_url} className="w-20 h-20 rounded-[12px] object-cover" />
              <div className="flex-1"><p className="text-xs font-bold">{c.seller_name} - <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{c.status}</span></p><p className="text-[11px] opacity-60">{c.description}</p><div className="flex gap-2 mt-2">{c.status !== 'approved' && <button onClick={async () => { await supabase.from("collections").update({ status: "approved" }).eq("id", c.id); load(); }} className="text-[10px] px-3 py-1 rounded-full bg-green-500 text-white">Approve</button>}<button onClick={async () => { await supabase.from("collections").delete().eq("id", c.id); load(); }} className="text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">Delete</button></div></div>
            </div>)}
          </div>
        </div>
      )}

      <div className="mt-10 p-3 rounded-[12px] bg-white border">
        <p className="text-xs font-bold">Run this SQL first in Supabase:</p>
        <code className="text-[10px] block mt-2 bg-black/5 p-2 rounded">create table collections (id uuid default gen_random_uuid() primary key, seller_name text, description text, whatsapp text, image_url text, status text default 'pending', created_at timestamp default now()); alter table collections enable row level security; create policy "public all" on collections for all using (true) with check (true);</code>
      </div>
    </div>
  );
}