"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const cleanId = id.trim().toLowerCase();

    // SECRET CHECK - hidden from UI
    const secret = "/ksom";
    if (!cleanId.endsWith(secret)) {
      setErr("❌ Verification failed. Contact KSOM admin for seller access.");
      return;
    }

    localStorage.setItem("ksm_seller_id", id.trim());
    localStorage.setItem("ksm_seller_name", name || "KSOM Seller");
    localStorage.setItem("ksm_is_seller", "true");

    setErr("✅ Verified! Redirecting...");
    setTimeout(() => router.push("/sell"), 800);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] grid place-items-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[24px] p-6 border border-black/10 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-white rounded-full p-1 border grid place-items-center">
            <img src="knust-logo.png" className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[11px] tracking-widest">KSOM — SELLER LOGIN</span>
        </div>

        <h1 className="text-[22px] font-light leading-tight">Seller verification</h1>
        <p className="text-[11px] opacity-60 mt-2">Enter your verified seller ID provided by KSOM admin.</p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Shop name"
          className="w-full mt-5 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none"
        />
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder="Verified Seller ID"
          className="w-full mt-3 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none border focus:border-black"
        />

        {err && <p className="text-[11px] mt-3 p-2.5 rounded-[12px] bg-black text-white text-center">{err}</p>}

        <button onClick={handleLogin} className="w-full mt-4 bg-black text-white py-3.5 rounded-full text-[13px] font-bold">
          Verify & Continue →
        </button>

        <p className="text-[10px] opacity-40 mt-4 text-center">Contact admin on WhatsApp for seller verification.</p>
        <a href="/" className="text-[11px] mt-3 block text-center underline">← Back to Market</a>
      </div>
    </div>
  );
}