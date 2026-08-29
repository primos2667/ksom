
export function formatGhs(price: number) {
  return `GH₵ ${Number(price).toFixed(2)}`;
}

// Whatsapp helpers
export function formatWhatsapp(phone: string) {
  if (!phone) return "";
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "233" + p.slice(1);
  if (!p.startsWith("233")) p = "233" + p;
  return p;
}

export function getWhatsappLink(phone: string, productName?: string) {
  const formatted = formatWhatsapp(phone);
  const msg = productName
    ? `Hi, I am interested in your ${productName} on KSOM.Is it still available ?`
    : "Hi, I am interested in your item on KSOM.";
  return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
}

export function productWhatsappUrl(product: any) {
  return getWhatsappLink(product?.profiles?.whatsapp || product?.whatsapp || "", product?.title);
}

// Aliases so ANY name works
export const productWhatsappLink = productWhatsappUrl;
export const getWhatsappUrl = getWhatsappLink;
export const formatGHS = formatGhs;