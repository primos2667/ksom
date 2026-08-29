export function formatGhs(price: number) {
  return `GH₵ ${Number(price).toFixed(2)}`;
}

export function formatWhatsapp(phone: string) {
  if (!phone) return "";
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "233" + p.slice(1);
  if (!p.startsWith("233")) p = "233" + p;
  return p;
}

function buildLink(phone: string, title?: string) {
  const formatted = formatWhatsapp(phone);
  const msg = title
    ? `Hi, I am interested in your ${title} on KSOM.Is it still available ?`
    : "Hi, I am interested in your item on KSOM.";
  return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
}

// This now accepts: product object OR (title, number) OR (number, title)
export function productWhatsappUrl(arg1: any, arg2?: any): string {
  // case 1: product object
  if (arg1 && typeof arg1 === "object") {
    const phone = arg1?.profiles?.whatsapp_number || arg1?.profiles?.whatsapp || arg1?.whatsapp || arg1?.whatsapp_number || "";
    const title = arg1?.title || "";
    return buildLink(phone, title);
  }
  // case 2: (title, phone) as in your ProductCard
  if (typeof arg1 === "string" && typeof arg2 === "string") {
    return buildLink(arg2, arg1);
  }
  // case 3: just phone
  return buildLink(arg1 || "", arg2 || "");
}

export const productWhatsAppUrl = productWhatsappUrl;
export const productWhatsappLink = productWhatsappUrl;
export const productWhatsAppLink = productWhatsappUrl;
export function getWhatsappLink(phone: string, productName?: string) {
  return buildLink(phone, productName);
}
export const getWhatsappUrl = getWhatsappLink;