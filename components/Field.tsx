"use client";

type Props = {
  label: string;
  children: React.ReactNode;
};

export default function Field({ label, children }: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-navy/70">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl bg-white px-3 text-sm font-semibold text-navy shadow-[0_0_0_1px_rgba(20,23,40,0.12)] outline-none focus:shadow-[0_0_0_2px_rgba(52,197,186,0.5)]";
