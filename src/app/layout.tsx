import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/sw-register";

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
  manifest: "/manifest.json",
  icons: {
    icon: "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/df08fb9e3d5a3c624d9f0e9a372256da/Goothiah-1.png",
    apple: "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/df08fb9e3d5a3c624d9f0e9a372256da/Goothiah-1.png",
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
  appleWebApp: {
    capable: true,
    title: "Goothiah TV",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
