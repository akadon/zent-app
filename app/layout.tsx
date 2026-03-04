import type { Metadata, Viewport } from "vinext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zent",
  description: "Self-hosted communication platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0c1018",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background-primary text-text-normal">
        {children}
      </body>
    </html>
  );
}
