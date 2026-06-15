import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

// Rounded, bold display face matching the TLF site's friendly heading style.
const display = Baloo_2({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TLF Partners — Support Hub",
  description: "AI-powered support inbox for TLF Partners (internal MVP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
