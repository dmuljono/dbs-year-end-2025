import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.APP_NAME || "DBS Year End 2025 Microsite",
  description: "Microsite for DBS Year End 2025"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}