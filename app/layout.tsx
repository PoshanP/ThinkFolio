import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { DataProvider } from "@/lib/contexts/DataContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AlertProvider } from "@/lib/contexts/AlertContext";
import { StatsProvider } from "@/lib/contexts/StatsContext";
import { ConfirmProvider } from "@/lib/contexts/ConfirmContext";
import { StarryBackground } from "@/frontend/components/StarryBackground";
import { BRAND } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BRAND.name} - AI Document Chat`,
  description: BRAND.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var resolved = theme;

                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }

                  document.documentElement.classList.add(resolved);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}>
        <ThemeProvider>
          <AlertProvider>
            <ConfirmProvider>
              <AuthProvider>
                <DataProvider>
                  <StatsProvider>
                    <StarryBackground />
                    <div className="min-h-screen relative z-10">
                      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
                        {children}
                      </main>
                    </div>
                  </StatsProvider>
                </DataProvider>
              </AuthProvider>
            </ConfirmProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}