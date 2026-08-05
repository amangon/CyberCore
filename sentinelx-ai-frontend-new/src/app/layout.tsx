import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelX AI",
  description: "AI Powered Cybersecurity Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}