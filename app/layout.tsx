import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "KSOM - KNUST Students Online Market",
  description: "Buy & Sell on KNUST campus. Verified students, WhatsApp chat.",
  manifest: "/manifest.json",
  icons: { icon: "/knust-logo.png", apple: "/knust-logo.png" },
  openGraph: {
    title: "KSOM - KNUST Students Online Market",
    description: "Buy & Sell on campus. Verified students.",
    url: "https://ksom.vercel.app",
    siteName: "KSOM",
    images: [{ url: "/knust-logo.png", width: 512, height: 512 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KSOM" />
      </head>
      <body>{children}</body>
    </html>
  );
}
