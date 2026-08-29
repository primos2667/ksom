"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#fbfaf8] p-5 flex flex-col">
      <h1 className="text-xl font-medium">Log in to KSOM</h1>
      <p className="text-xs opacity-60 mt-1">Use your KNUST email to verify</p>
      <div className="mt-8 max-w-md w-full">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@st.knust.edu.gh" className="w-full rounded-full px-4 py-3 border border-black/10 outline-none text-sm" />
        <button onClick={() => {
          localStorage.setItem("ksm_user", email);
          alert("Logged in as " + email);
          router.push("/");
        }} className="mt-3 w-full bg-black text-white rounded-full py-3.5 text-sm font-medium">Continue</button>
        <button onClick={() => router.push("/")} className="mt-3 w-full bg-white border border-black/10 rounded-full py-3.5 text-sm">Back Home</button>
      </div>
    </div>
  );
}