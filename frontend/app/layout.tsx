import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GlobePay — Cross-Border Digital Banking",
  description: "Multi-currency digital banking and payments platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
