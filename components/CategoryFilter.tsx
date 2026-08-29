"use client";

import { CATEGORIES } from "@/lib/constants";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const OPTIONS = ["All", ...CATEGORIES];

export default function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-1 py-2">
      {OPTIONS.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-extrabold shadow-[0_0_0_1px_rgba(20,23,40,0.15)] active:scale-95 ${
              active ? "bg-navy text-gold" : "bg-navy text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
