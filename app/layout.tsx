import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPWA } from "@/components/InstallPWA";

export const metadata: Metadata = {
  title: "Prima KSOM - KNUST Students Online Market | Buy & Sell on Campus",
  description: "Prima KSOM - KNUST Students Online Market. Buy & Sell phones, laptops, shoes, fashion, books & more on KNUST campus. Verified students, WhatsApp chat, no payment yet. Join 10k+ students!",
  keywords: ["KNUST", "Prima KSOM", "KSOM", "KNUST market", "students market", "buy sell KNUST", "Ayeduase", "Kotei", "Ghana students"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Prima KSOM - KNUST Students Online Market",
    description: "Buy & Sell on KNUST campus. Verified students, WhatsApp chat.",
    url: "https://ksom.vercel.app",
    siteName: "Prima KSOM",
    images: [{ url: "/ksom-icon-512.png", width: 512, height: 512 }],
    type: "website",
  },
  icons: {
    icon: "/ksom-icon-512.png",
    apple: "/ksom-icon-512.png",
  },
  appleWebApp: {
    capable: true,
    title: "Prima KSOM",
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
      <head>
        {/* BLOCKING - NO FLASH - Sets theme BEFORE first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = localStorage.getItem('ksom-theme');
                  var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var t = s || (d ? 'dark' : 'light');
                  var h = document.documentElement;
                  h.classList.remove('light','dark');
                  h.classList.add(t);
                  h.style.colorScheme = t;
                } catch(e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          html { background: #fbfaf8; }
          html.dark { background: #0f0f0f; }
          /* Prevent white flash in dark mode */
          html.dark body { background: #0f0f0f; }
          html.light body { background: #fbfaf8; }
        `}} />
      </head>
      <body className="antialiased bg-[#fbfaf8] dark:bg-[#0f0f0f] transition-none">
        <ThemeProvider>
          {children}
          <InstallPWA />
        </ThemeProvider>
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
