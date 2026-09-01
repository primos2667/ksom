"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <header className="fixed inset-x-0 top-0 z-50 bg-white dark:bg-[#0f0f0f] border-b dark:border-zinc-800">
      <div className="grid grid-cols-[72px_1fr_72px] items-center border-b border-[#1f6c1f]/10 dark:border-white/10">
        <Link href="/" className="flex h-16 items-center pl-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[11px] font-extrabold text-gold">
            KN
          </span>
        </Link>
        <p className="text-center text-[13px] font-bold tracking-wide text-navy dark:text-white">
          STUDENTS&apos; ONLINE MARKET
        </p>
        <div className="flex h-16 items-center justify-end pr-3">
          <Image src="/tag.svg" alt="KSOM" width={52} height={28} className="h-7 w-auto dark:invert" />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold text-navy/70 dark:text-white/60">KSOM · KNUST</p>

        <div className="flex items-center gap-3">
          {/* THEME TOGGLE - Added here next to profile */}
          <ThemeToggle />

          {loading ? (
            <span className="text-xs text-navy/40 dark:text-white/40">…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xs font-semibold text-navy dark:text-white">
                {profile?.full_name || "Account"}
              </Link>
              <button type="button" onClick={signOut} className="text-xs font-semibold text-navy/50 dark:text-white/60">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-xs font-bold text-teal dark:text-teal-300">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
