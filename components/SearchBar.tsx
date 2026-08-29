"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = "Search on KSOM" }: Props) {
  return (
    <div className="group relative flex">
      <svg
        className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 stroke-teal transition group-focus-within:scale-90 group-focus-within:opacity-0"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        className="h-10 w-full rounded-full bg-[#f8f8f8] pl-12 pr-4 text-xs font-bold text-navy shadow-[0_0_0_1px_rgba(20,23,40,0.15)] outline-none transition placeholder:text-navy/40 focus:pl-5 focus:outline focus:outline-1 focus:outline-teal/70"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
