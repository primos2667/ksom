import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "KSOM - KNUST Students Online Market | Buy & Sell on Campus",
  description: "KSOM - KNUST Students Online Market. Buy & Sell phones, laptops, shoes, fashion, books & more on KNUST campus. Verified students, WhatsApp chat, no payment yet. Join 10k+ students!",
  keywords: ["KNUST", "KSOM", "KNUST market", "students market", "buy sell KNUST", "Ayeduase", "Kotei", "Ghana students"],
  manifest: "/manifest.json",
  openGraph: {
    title: "KSOM - KNUST Students Online Market",
    description: "Buy & Sell on KNUST campus. Verified students, WhatsApp chat.",
    url: "https://ksom.vercel.app",
    siteName: "KSOM",
    images: [{ url: "/ksom-icon.png", width: 512, height: 512 }],
    type: "website",
  },
  icons: {
    icon: "/ksom-icon.png",
    apple: "/ksom-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "KSOM",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white dark:bg-[#0f0f0f] transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.NODE_ENV === "production" && (
          <script dangerouslySetInnerHTML={{
            __html: `
              console.log = () => {};
              console.warn = () => {};
              console.error = () => {};
            `
          }} />
        )}
      </body>
    </html>
  );
}
