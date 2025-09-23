import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { DataProvider } from "@/lib/contexts/DataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThinkFolio - AI Document Chat",
  description: "Upload, analyze, and chat with PDFs, books, and documents using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <AuthProvider>
          <DataProvider>
            <div className="min-h-screen bg-gray-900">
              <main className="container mx-auto px-6 py-6 max-w-7xl">
                {children}
              </main>
            </div>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}