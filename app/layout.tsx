import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = new URL(`${protocol}://${host}`);
  const title = "CONTRARIA — Decision Intelligence OS";
  const description = "The epistemic operating system that tries to prove your strategy wrong before reality does.";
  return {
    metadataBase: origin,
    title,
    description,
    applicationName: "CONTRARIA",
    authors: [{ name: "CONTRARIA Labs" }],
    keywords: ["decision intelligence", "RAG", "Monte Carlo", "evidence graph", "strategy"],
    openGraph: { title, description, type: "website", url: origin, images: [{ url: new URL("/og.png", origin), width: 1792, height: 938, alt: "CONTRARIA evidence and counterfactual decision intelligence" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.png", origin)] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070908",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
