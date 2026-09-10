"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const cleanId = id.trim().toLowerCase();
    const cleanWa = whatsapp.trim().replace(/[^0-9]/g, '');

    if (!cleanId.endsWith("/ksom")) {
      setErr("❌ Only verified sellers! Join Community to be verified ✅");
      return;
    }
    if (!name.trim()) {
      setErr("❌ Enter your shop name!");
      return;
    }
    if (cleanWa.length < 9) {
      setErr("❌ Enter valid WhatsApp number! (e.g. 0540000001 or 233540000001)");
      return;
    }
    // Normalize to 233 format for storage
    let normalizedWa = cleanWa;
    if (cleanWa.length === 10 && cleanWa.startsWith("0")) {
      normalizedWa = "233" + cleanWa.slice(1);
    } else if (cleanWa.length === 9) {
      normalizedWa = "233" + cleanWa;
    }

    localStorage.setItem("ksm_seller_id", id.trim());
    localStorage.setItem("ksm_seller_name", name.trim());
    localStorage.setItem("ksm_seller_whatsapp", normalizedWa);
    localStorage.setItem("ksm_whatsapp", normalizedWa);
    localStorage.setItem("ksm_is_seller", "true");

    setErr("✅ Verified! Redirecting to Sell...");
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
        <p className="text-[11px] opacity-60 mt-2">Only verified students. Join Community!</p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your shop name (e.g. Prince Phones)"
          className="w-full mt-5 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none"
        />
        <p className="text-[9px] opacity-50 mt-1 px-2">🔒 Locked after login!</p>
        <input
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          placeholder="WhatsApp number (e.g. 0540000001)"
          className="w-full mt-3 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none border focus:border-black"
        />
        <p className="text-[9px] opacity-50 mt-1 px-2">🔒 Locked after login!</p>
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder="KSOM ID"
          className="w-full mt-3 px-4 py-3 rounded-full bg-[#f3f3f5] text-[13px] outline-none border focus:border-black"
        />

        {err && <p className="text-[11px] mt-3 p-2.5 rounded-[12px] bg-black text-white text-center">{err}</p>}

        <button onClick={handleLogin} className="w-full mt-4 bg-black text-white py-3.5 rounded-full text-[13px] font-bold">
          Verify & Continue to Sell →
        </button>

        <p className="text-[10px] opacity-40 mt-4 text-center">🔒 WhatsApp & Name locked after login. Please use right info!</p>
        <a href="/" className="text-[11px] mt-3 block text-center underline">← Back to Market</a>
      </div>
    </div>
  );
}
