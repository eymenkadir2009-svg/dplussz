import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D+SZ — Stream the Stories You Love",
  description:
    "D+SZ is a premium streaming experience. Browse trending originals, hit movies, and award-winning dramas — all in one place.",
  keywords: ["D+SZ", "streaming", "movies", "TV shows", "originals", "watch online"],
  authors: [{ name: "D+SZ" }],
  icons: {
    icon: "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/c88918a7996db3a88593b37770f73fd5/S-13-1.png",
  },
  openGraph: {
    title: "D+SZ — Stream the Stories You Love",
    description:
      "Premium streaming. Browse trending originals, hit movies, and award-winning dramas.",
    siteName: "D+SZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "D+SZ — Stream the Stories You Love",
    description:
      "Premium streaming. Browse trending originals, hit movies, and award-winning dramas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} antialiased bg-black text-white min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
