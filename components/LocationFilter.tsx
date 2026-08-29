"use client";

import { LOCATIONS } from "@/lib/constants";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function LocationFilter({ value, onChange }: Props) {
  return (
    <div className="px-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-full bg-white px-4 text-xs font-bold text-navy shadow-[0_0_0_1px_rgba(20,23,40,0.15)] outline-none"
      >
        <option value="All">All locations</option>
        {LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
    </div>
  );
}
