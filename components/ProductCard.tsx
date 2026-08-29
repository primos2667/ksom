"use client";

import { formatGhs, productWhatsAppUrl } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const whatsapp = productWhatsAppUrl(product.title, product.profiles?.whatsapp_number);
  const image = product.image_url || "/placeholder-product.svg";

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(20,23,40,0.08)]">
      <div className="relative aspect-square bg-[#eee]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={product.title} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-gold">
          {product.condition}
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-navy">{product.title}</p>
        <p className="text-sm font-extrabold text-teal">{formatGhs(product.price)}</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full bg-[#f8f8f8] px-2 py-0.5 text-[10px] font-semibold text-navy/70">
            {product.category}
          </span>
          {product.location ? (
            <span className="rounded-full bg-[#f8f8f8] px-2 py-0.5 text-[10px] font-semibold text-navy/70">
              {product.location}
            </span>
          ) : null}
        </div>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex h-9 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-white"
          >
            WhatsApp seller
          </a>
        ) : (
          <p className="mt-2 text-center text-[11px] font-semibold text-navy/40">No WhatsApp listed</p>
        )}
      </div>
    </article>
  );
}
