"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white">
      <div className="grid grid-cols-[72px_1fr_72px] items-center border-b border-[#1f6c1f]/10">
        <Link href="/" className="flex h-16 items-center pl-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[11px] font-extrabold text-gold">
            KN
          </span>
        </Link>
        <p className="text-center text-[13px] font-bold tracking-wide text-navy">
          STUDENTS&apos; ONLINE MARKET
        </p>
        <div className="flex h-16 items-center justify-end pr-3">
          <Image src="/tag.svg" alt="KSOM" width={52} height={28} className="h-7 w-auto" />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
        <p className="text-xs font-semibold text-navy/70">KSOM · KNUST</p>
        {loading ? (
          <span className="text-xs text-navy/40">…</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-semibold text-navy">
              {profile?.full_name || "Account"}
            </Link>
            <button type="button" onClick={signOut} className="text-xs font-semibold text-navy/50">
              Log out
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-xs font-bold text-teal">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
