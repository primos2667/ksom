"use client";

import { formatGhs, productWhatsAppUrl } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const whatsapp = productWhatsAppUrl(product.title, product.profiles?.whatsapp);
  const image = product.image_url || "/placeholder-product.svg";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition">
      <div className="relative aspect-square bg-[#f8f8f8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={product.title} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {product.condition}
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-navy">{product.title}</p>
        <p className="text-sm font-extrabold text-teal-600">{formatGhs(product.price)}</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full bg-[#f8f8f8] px-2 py-0.5 text-[10px] text-gray-600">
            {product.category}
          </span>
        </div>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center rounded-full bg-[#25D366] py-2 text-sm font-bold text-white hover:bg-[#1da851] transition"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
