"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdvertisePage() {
  const [form, setForm] = useState({ business_name: "", description: "", whatsapp: "", image_url: "", duration: "1 week" });
  const [uploading, setUploading] = useState(false);
  const [myAdverts, setMyAdverts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  const ADMIN_EMAIL = "primos7662@gmail.com";

  useEffect(() => {
    const e = (localStorage.getItem("ksm_user") || "").toLowerCase().trim();
    setIsAdmin(e === ADMIN_EMAIL.toLowerCase() || e === "admin@ksom.com");
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("adverts").select("*").order("created_at", { ascending: false });
    if (data) setMyAdverts(data);
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileName = "advert-" + Date.now() + "-" + file.name;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setForm({ ...form, image_url: data.publicUrl });
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.business_name || !form.description || !form.whatsapp) { alert("Fill all"); return; }
    await supabase.from("adverts").insert([{ ...form, status: "pending" }]);
    alert("Request sent! Admin will approve.");
    setForm({ business_name: "", description: "", whatsapp: "", image_url: "", duration: "1 week" });
    load();
  };

  const deleteAdvert = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Delete?")) return;
    await supabase.from("adverts").delete().eq("id", id);
    load();
  };
  const approve = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from("adverts").update({ status: "approved" }).eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 pb-28">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Advertise on KSOM 📢</h1><a href="/" className="text-xs px-4 py-2 rounded-full bg-black text-white">Home</a></div>

      <div className="mt-4 p-4 rounded-[18px] bg-black text-white">
        <p className="text-sm font-bold">Reach 10,000+ KNUST Students</p>
        <p className="text-xs opacity-70 mt-1">From GH₵ 20/week. Your ad on homepage carousel.</p>
        {!isAdmin && <p className="text-[10px] mt-2 text-yellow-300">You are viewing as student - Admin controls hidden</p>}
        {isAdmin && <p className="text-[10px] mt-2 text-green-300">✅ Admin mode - You can approve/delete</p>}
      </div>

      <h2 className="text-sm font-bold mt-6">Request Advert</h2>
      <div className="mt-3 grid gap-3 max-w-md">
        <input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Business Name" className="w-full rounded-full px-4 py-3 border border-black/10 bg-white text-sm outline-none" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What do you sell?" className="w-full rounded-[18px] px-4 py-3 border border-black/10 bg-white text-sm outline-none h-20" />
        <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp 2335..." className="w-full rounded-full px-4 py-3 border border-black/10 bg-white text-sm outline-none" />
        <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full rounded-full px-4 py-3 border border-black/10 bg-white text-sm outline-none">
          <option>1 week - GH₵ 20</option><option>2 weeks - GH₵ 35</option><option>1 month - GH₵ 60</option>
        </select>

        {/* INSTAGRAM STYLE UPLOAD PREVIEW - NO CUT, NO STRETCH */}
        <div className="rounded-[18px] border border-dashed border-black/20 p-3 bg-white">
          {form.image_url ? (
            <div
              onClick={() => setExpandedImg(form.image_url)}
              className="relative w-full aspect-[16/9] overflow-hidden rounded-[12px] bg-black cursor-pointer group"
            >
              {/* Blurred bg */}
              <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-[20px] scale-110 opacity-60" />
              {/* Real image - contain = no stretch */}
              <img src={form.image_url} className="relative w-full h-full object-contain" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">Tap to expand</div>
            </div>
          ) : (
            <p className="text-xs opacity-40 py-10 text-center">No banner - upload any size, it will fit!</p>
          )}
          <label className="mt-3 inline-block px-4 py-2 rounded-full bg-black text-white text-xs cursor-pointer">{uploading ? "Uploading..." : "Upload Banner - Any Size"}<input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>
          <p className="text-[10px] opacity-40 mt-2">✅ Any dimension works! Square, portrait, landscape - no cutting!</p>
        </div>

        <button onClick={submit} className="w-full bg-black text-white rounded-full py-3 text-sm font-bold">Submit Request</button>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-bold">Live on Homepage ({myAdverts.filter((a: any) => a.status === 'approved').length})</h2>
        <div className="mt-3 grid gap-3">
          {myAdverts.filter((a: any) => a.status === 'approved').map((a: any) => (
            <div key={a.id} className="p-3 rounded-[18px] bg-white border border-green-200 flex gap-3">
              {/* INSTAGRAM STYLE THUMB */}
              <div onClick={() => setExpandedImg(a.image_url)} className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-black flex-shrink-0 cursor-pointer">
                <img src={a.image_url} className="absolute inset-0 w-full h-full object-cover blur-[12px] opacity-60" alt="" />
                <img src={a.image_url} className="relative w-full h-full object-contain" alt="" />
              </div>
              <div><p className="text-xs font-bold">{a.business_name} ✅ LIVE</p><p className="text-[11px] opacity-60">{a.description}</p><p className="text-[10px] mt-1 opacity-40">Tap image to expand</p></div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-10 p-4 rounded-[18px] bg-yellow-50 border border-yellow-200">
          <h2 className="text-sm font-bold">🔒 ADMIN ONLY - Pending ({myAdverts.filter((a: any) => a.status !== 'approved').length})</h2>
          <div className="mt-3 grid gap-3">
            {myAdverts.filter((a: any) => a.status !== 'approved').map((a: any) => (
              <div key={a.id} className="p-3 rounded-[18px] bg-white border border-black/10 flex gap-3">
                <div onClick={() => setExpandedImg(a.image_url)} className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-black flex-shrink-0 cursor-pointer">
                  <img src={a.image_url} className="absolute inset-0 w-full h-full object-cover blur-[12px] opacity-60" alt="" />
                  <img src={a.image_url} className="relative w-full h-full object-contain" alt="" />
                </div>
                <div className="flex-1"><p className="text-xs font-bold">{a.business_name}</p><p className="text-[11px] opacity-60">{a.description}</p><div className="flex gap-2 mt-2"><button onClick={() => approve(a.id)} className="text-[10px] px-3 py-1 rounded-full bg-green-500 text-white">Approve</button><button onClick={() => deleteAdvert(a.id)} className="text-[10px] px-3 py-1 rounded-full bg-red-500 text-white">Delete</button></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN EXPAND MODAL */}
      {expandedImg && (
        <div onClick={() => setExpandedImg(null)} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md grid place-items-center p-4">
          <button onClick={() => setExpandedImg(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center">✕</button>
          <img src={expandedImg} className="w-full max-w-4xl h-auto max-h-[85vh] object-contain rounded-[16px]" alt="Full advert" />
          <p className="text-white/40 text-center mt-4 text-[11px]">Tap anywhere to close • Pinch to zoom</p>
        </div>
      )}
    </div>
  );
}