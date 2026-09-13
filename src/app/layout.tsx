import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goothiah TV — Stream the Stories You Love",
  description:
    "Goothiah TV is a premium streaming experience. Browse trending originals, hit movies, and award-winning dramas — all in one place.",
  keywords: ["Goothiah TV", "streaming", "movies", "TV shows", "originals", "watch online"],
  authors: [{ name: "Goothiah TV" }],
  icons: {
    icon: "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/1a6555bcf5f72a1c43ad29a08e449432/Goothiah-removebg-preview-1.png",
  },
  openGraph: {
    title: "Goothiah TV — Stream the Stories You Love",
    description:
      "Premium streaming. Browse trending originals, hit movies, and award-winning dramas.",
    siteName: "Goothiah TV",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goothiah TV — Stream the Stories You Love",
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
