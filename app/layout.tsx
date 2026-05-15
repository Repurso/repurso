import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://repurso.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Repurso — AI Content Repurposing Tool",
    template: "%s | Repurso",
  },
  description:
    "Turn one idea into platform-native content for LinkedIn, X, Instagram, TikTok, YouTube, Facebook, Threads, Snapchat and Pinterest.",
  keywords: [
    "AI content repurposing",
    "social media content generator",
    "LinkedIn post generator",
    "TikTok script generator",
    "Instagram caption generator",
    "content creator tools",
    "Repurso",
  ],
  applicationName: "Repurso",
  authors: [{ name: "Repurso" }],
  creator: "Repurso",
  publisher: "Repurso",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Repurso — Turn one idea into content for every platform",
    description:
      "Repurso helps creators, founders and marketers repurpose one idea into platform-native content in seconds.",
    url: "/",
    siteName: "Repurso",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Repurso — AI Content Repurposing Tool",
    description:
      "Create platform-native posts, captions, scripts and descriptions from one idea.",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
