import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nagrik — One voice. Collective action.",
  description:
    "AI-powered hyperlocal community platform. Report, verify, track and collectively solve public issues in your neighbourhood.",
  keywords: ["community", "civic", "local issues", "AI", "reporting"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nagrik",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0fdf4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes leaflet-ping {
                0% { transform: scale(1); opacity: 0.4; }
                100% { transform: scale(2.5); opacity: 0; }
              }
              .leaflet-container {
                background: #1a1a2e !important;
                font-family: inherit;
              }
              .leaflet-popup-content-wrapper {
                background: #1c1c2e !important;
                color: #e0e0e0 !important;
                border-radius: 12px !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
              }
              .leaflet-popup-tip {
                background: #1c1c2e !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                box-shadow: none !important;
              }
              .leaflet-popup-close-button {
                color: #888 !important;
              }
              .custom-marker, .user-location-marker, .search-marker {
                background: transparent !important;
                border: none !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
