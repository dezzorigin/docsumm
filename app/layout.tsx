import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docsumm.pages.dev"),
  title: "DocSumm — Any document. Instant clarity.",
  description:
    "DocSumm mengubah dokumen — PDF, foto, atau hasil scan — menjadi ringkasan terstruktur yang bisa langsung dipakai: overview, poin kritis, action item, tanggal penting, dan metadata.",
  openGraph: {
    title: "DocSumm — Any document. Instant clarity.",
    description:
      "DocSumm mengubah dokumen — PDF, foto, atau hasil scan — menjadi ringkasan terstruktur yang bisa langsung dipakai: overview, poin kritis, action item, tanggal penting, dan metadata.",
    type: "website",
    url: "https://docsumm.pages.dev",
    images: [
      {
        url: "https://docsumm.pages.dev/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocSumm — Any document. Instant clarity.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocSumm — Any document. Instant clarity.",
    description:
      "DocSumm mengubah dokumen — PDF, foto, atau hasil scan — menjadi ringkasan terstruktur yang bisa langsung dipakai: overview, poin kritis, action item, tanggal penting, dan metadata.",
    images: ["https://docsumm.pages.dev/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
