import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/frontend/components/Navbar";
import { AuthProvider } from "@/lib/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThinkFolio - Research Paper Chat",
  description: "Upload, analyze, and chat with research papers using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}