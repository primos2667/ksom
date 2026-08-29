import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KSOM - KNUST Students' Online Market",
  description: "Buy and sell on campus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}