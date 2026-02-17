import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import Navbar from "@/components/Navbar";
import ShopBot from "@/components/ShopBot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scannimart",
  description: "A modern shopping and billing system with QR scanning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}
      >
        <Toaster position="top-right" />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <ShopBot />
        <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Scannimart. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
