import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Datafy Associate — Empowering Performance With Precise Aerial Insights",
  description:
    "Datafy Associate delivers AI-driven drone inspections, solar O&M, third-party verification, and topographical mapping for clean energy assets.",
  keywords: [
    "solar inspection",
    "drone inspection",
    "solar O&M",
    "topographical mapping",
    "Datafy Associate",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
