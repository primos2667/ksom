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
    images: [{ url: "/ksom-icon.png", width: 512, height: 512 }],
    type: "website",
  },
  icons: {
    icon: "/ksom-icon.png",
    apple: "/ksom-icon.png",
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
        {/* BLOCKING SCRIPT - Sets theme BEFORE page renders - No flash! */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('ksom-theme');
                  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved || (sysDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-[#0f0f0f]">
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
