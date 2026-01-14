"use client";

import Link from "next/link";
import { FileText, User, LogOut, Menu } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { useAuth } from "@/lib/contexts/AuthContext";

export function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  // Close user menu when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isUserMenuOpen]);

  const handleSignOut = useCallback(async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
  }, [signOut]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 md:space-x-8">
              {/* Mobile hamburger menu */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Open menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}

              <Link href="/" className="flex items-center space-x-2">
                <FileText className="h-7 w-7 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  ThinkFolio
                </span>
              </Link>

              {/* Desktop navigation */}
              {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/papers"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>My Library</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="relative" data-user-menu>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px]"
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="true"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden md:block">Account</span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left min-h-[44px]"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2 min-h-[44px]"
                    >
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors min-h-[44px]"
                    >
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        isAuthenticated={isAuthenticated}
        onSignOut={handleSignOut}
      />
    </>
  );
}
